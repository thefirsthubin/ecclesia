import { engagementSignalEnvelopeSchema } from '@ecclesia/contracts';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { ChurchPulseRecomputeJob } from './church-pulse-recompute.job';
import { InsightsConsumer } from '../../consumers/insights/insights.consumer';

/**
 * Integration-level regression test for the Engagement Signal -> Church
 * Pulse gap: `InsightsConsumer` (SQS) and `ChurchPulseRecomputeJob`
 * (scheduled sweep) are both real, wired components, but before
 * `mapEngagementSignalToChurchPulseCategory` existed, nothing connected
 * the raw `eventType` strings real domain services publish (e.g.
 * `'attendance.recorded'`) to the bare category literals
 * (`'ATTENDANCE'`) `ChurchPulseRecomputeJob`'s scoring logic expected -
 * every signal was persisted and then silently excluded from scoring.
 *
 * Unlike `pulse-score.service.spec.ts`/`church-pulse-recompute.job.spec.ts`'s
 * own unit tests (which mock each class's repository independently), this
 * test starts from an actual `EngagementSignalEnvelope` - the same shape
 * `attendance-record.service.ts` constructs and `EventBridgePublisherService`
 * would put on the bus - runs it through `InsightsConsumer.handle()` (the
 * same method the real SQS poll loop calls), and feeds the *captured*
 * persisted value into `ChurchPulseRecomputeJob`, rather than re-typing a
 * category literal by hand. No live SQS/EventBridge/Postgres is
 * available in this environment (a disclosed, repo-wide sandbox
 * limitation - see `WORKER_DESIGN_NOTES.md`); this is the strongest
 * meaningful substitute: every repository boundary is mocked, but the
 * envelope, the consumer, the shared mapping function, and the scoring
 * job are all the real production classes/values, not stand-ins.
 */
describe('Engagement Signal -> Church Pulse integration', () => {
  function buildConsumer(engagementSignalRepository: { create: jest.Mock }) {
    const sqsClient = { send: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('https://sqs.example/insights-consumer') };
    const processedEventRepository = { tryRecord: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    return new InsightsConsumer(
      sqsClient as never,
      configService as never,
      processedEventRepository as never,
      logger as never,
      engagementSignalRepository as never,
      prisma as never,
    );
  }

  function buildJob() {
    const repository = {
      listActiveBacentaGroups: jest.fn().mockResolvedValue([]),
      countSignalsByTypeInWindow: jest.fn(),
      findChurchPulseWeights: jest.fn().mockResolvedValue(null),
      upsertPulseScore: jest.fn().mockResolvedValue({}),
      appendPulseScoreHistory: jest.fn().mockResolvedValue({}),
      findRecentHistoryByScope: jest.fn().mockResolvedValue([]),
      hasOpenAlert: jest.fn().mockResolvedValue(false),
      createAlert: jest.fn(),
    };
    const branchDirectory = { listBranches: jest.fn().mockResolvedValue([{ id: 'branch-1' }]) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new ChurchPulseRecomputeJob(repository as never, branchDirectory as never, prisma as never, logger as never);
    return { job, repository };
  }

  /** Exactly the envelope shape `attendance-record.service.ts` (Gatherings)
   * constructs for a non-Bacenta gathering - `eventType: 'attendance.recorded'`,
   * not the bare category name. Schema-validated below, not hand-waved. */
  function realAttendanceEnvelope(): EngagementSignalEnvelope {
    const envelope = {
      eventId: '11111111-1111-1111-1111-111111111111',
      eventType: 'attendance.recorded',
      schemaVersion: 1,
      branchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      occurredAt: '2026-08-01T09:00:00.000Z',
      subjectPersonId: '22222222-2222-2222-2222-222222222222',
      payload: {},
    };
    return engagementSignalEnvelopeSchema.parse(envelope);
  }

  /** A real event type published by apps/worker's follow-up-sla-sweep -
   * a breach alert, not a person's engagement action. Deliberately
   * excluded from Church Pulse scoring (see church-pulse-scoring.ts). */
  function realSlaBreachEnvelope(): EngagementSignalEnvelope {
    const envelope = {
      eventId: '33333333-3333-3333-3333-333333333333',
      eventType: 'pastoral_care.follow_up_task_sla_breached',
      schemaVersion: 1,
      branchId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      occurredAt: '2026-08-01T09:00:00.000Z',
      payload: { followUpTaskId: '44444444-4444-4444-4444-444444444444' },
    };
    return engagementSignalEnvelopeSchema.parse(envelope);
  }

  it('a real attendance.recorded envelope flows through the consumer, the shared mapping, and the recompute job to produce a non-zero Church Pulse score', async () => {
    const engagementSignalRepository = { create: jest.fn() };
    const consumer = buildConsumer(engagementSignalRepository);
    const envelope = realAttendanceEnvelope();

    // Step 1: the real SQS entry point (protected - invoked the same way
    // SqsConsumerBase.processMessage does internally, matching this
    // repo's own established pattern in insights.consumer.spec.ts).
    await (consumer as unknown as { handle(e: EngagementSignalEnvelope): Promise<void> }).handle(envelope);

    expect(engagementSignalRepository.create).toHaveBeenCalledTimes(1);
    const persisted = engagementSignalRepository.create.mock.calls[0][0] as { signalType: string; branchId: string };
    expect(persisted.signalType).toBe('attendance.recorded');

    // Step 2: what the recompute job would actually query back, ten weeks
    // of one Person's real attendance, using the *persisted* signalType
    // captured above rather than re-typing a literal by hand.
    const { job, repository } = buildJob();
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: persisted.signalType, count: 10 }]);

    await job.run();

    // 10 signals fully saturates ATTENDANCE; equal-sixths weighting caps
    // one saturated category at 100/6 - a real, non-zero score, not the
    // pre-fix 0 every Branch would have gotten regardless of activity.
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', score: expect.closeTo(100 / 6, 1) }),
    );
  });

  it('a real but deliberately-excluded event type is still persisted by the consumer (Insights ingests the whole stream) but contributes nothing to the Church Pulse score', async () => {
    const engagementSignalRepository = { create: jest.fn() };
    const consumer = buildConsumer(engagementSignalRepository);
    const envelope = realSlaBreachEnvelope();

    await (consumer as unknown as { handle(e: EngagementSignalEnvelope): Promise<void> }).handle(envelope);

    expect(engagementSignalRepository.create).toHaveBeenCalledTimes(1);
    const persisted = engagementSignalRepository.create.mock.calls[0][0] as { signalType: string };
    expect(persisted.signalType).toBe('pastoral_care.follow_up_task_sla_breached');

    const { job, repository } = buildJob();
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: persisted.signalType, count: 50 }]);

    await job.run();

    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', score: 0 }),
    );
  });
});
