import { ChurchPulseRecomputeJob } from './church-pulse-recompute.job';

describe('ChurchPulseRecomputeJob', () => {
  // `[Bug fix]` `computeAndStore`/`evaluateAndCreateAlertIfNeeded` build
  // `now` from the real system clock (`new Date()` inside
  // `church-pulse-recompute.job.ts` - not injected, so it can't be
  // stubbed via a constructor argument). The two tests below feed
  // `findRecentHistoryByScope` fixed, hardcoded history timestamps
  // (2026-07-15 / 2026-08-01) and rely on both landing inside
  // `evaluatePulseTrend`'s 21-day trailing window relative to *real*
  // "now" - which only holds while the suite happens to run on or
  // before 2026-08-05T00:00:00.000Z (`windowStart = now - 21d <=
  // 2026-07-15T00:00:00.000Z`). Run this suite on or after that
  // instant (confirmed failing via a real `pnpm test` run on
  // 2026-08-05) and `evaluatePulseTrend` silently drops the July point
  // from its window, collapsing `earliest`/`latest` to the same August
  // point and producing a 0-point delta instead of the intended
  // 20-point decline - not a logic bug in `evaluatePulseTrend` itself
  // (its window-filtering is correct), just a test fixture that decays
  // with the real calendar. Pinning the clock makes the window's
  // relationship to the fixture dates deterministic regardless of when
  // the suite actually runs.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function buildJob() {
    const repository = {
      listActiveBacentaGroups: jest.fn(),
      countSignalsByTypeInWindow: jest.fn(),
      findChurchPulseWeights: jest.fn(),
      upsertPulseScore: jest.fn(),
      appendPulseScoreHistory: jest.fn(),
      findRecentHistoryByScope: jest.fn(),
      hasOpenAlert: jest.fn(),
      createAlert: jest.fn(),
    };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new ChurchPulseRecomputeJob(repository as never, branchDirectory as never, prisma as never, logger as never);
    return { job, repository, branchDirectory };
  }

  it('recomputes Branch scope plus every active Bacenta scope, and returns the total scope count', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([{ id: 'group-1' }, { id: 'group-2' }]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 5 }]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([]);

    const scopeCount = await job.run();

    expect(scopeCount).toBe(3); // 1 BRANCH + 2 GROUP
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1' }),
    );
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-1' }),
    );
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-2' }),
    );
    expect(repository.appendPulseScoreHistory).toHaveBeenCalledTimes(3);
  });

  it('maps a real published event type to its Church Pulse category and produces a non-zero score (regression test for the eventType/category vocabulary gap)', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    // 'attendance.recorded' is the literal apps/api/src/modules/gatherings/
    // services/attendance-record.service.ts actually publishes - not the
    // bare 'ATTENDANCE' category name.
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 10 }]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([]);

    await job.run();

    // 10 signals fully saturates ATTENDANCE; equal-sixths weighting caps
    // one saturated category at 100/6.
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', score: expect.closeTo(100 / 6, 1) }),
    );
  });

  it('produces a non-zero score when church_pulse_weights is {} - the actual NOT NULL column default, not just when it is null (regression test for "Church Pulse always 0")', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 10 }]);
    // {} - a Branch that has never touched the weight-configuration screen,
    // not `null`. This is what `platform.configurations.church_pulse_weights`
    // actually holds by default (a NOT NULL JSONB column).
    repository.findChurchPulseWeights.mockResolvedValue({});
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([]);

    await job.run();

    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', score: expect.closeTo(100 / 6, 1) }),
    );
  });

  it('does not let a real, published-but-excluded event type (an SLA-breach alert, not an engagement action) contribute to the score', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    // A real event type published by apps/worker's follow-up-sla-sweep - a
    // breach alert, not a person's engagement action.
    repository.countSignalsByTypeInWindow.mockResolvedValue([
      { signalType: 'pastoral_care.follow_up_task_sla_breached', count: 50 },
    ]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([]);

    await job.run();

    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', score: 0 }),
    );
  });

  it('creates a PULSE_DECLINE alert when the trend has declined and none is already open', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([
      { score: { toNumber: () => 80 }, computedAt: new Date('2026-07-15T00:00:00.000Z') },
      { score: { toNumber: () => 60 }, computedAt: new Date('2026-08-01T00:00:00.000Z') },
    ]);
    repository.hasOpenAlert.mockResolvedValue(false);

    await job.run();

    expect(repository.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', alertType: 'PULSE_DECLINE' }),
    );
  });

  it('does not create a duplicate alert when one is already open', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([
      { score: { toNumber: () => 80 }, computedAt: new Date('2026-07-15T00:00:00.000Z') },
      { score: { toNumber: () => 60 }, computedAt: new Date('2026-08-01T00:00:00.000Z') },
    ]);
    repository.hasOpenAlert.mockResolvedValue(true);

    await job.run();

    expect(repository.createAlert).not.toHaveBeenCalled();
  });
});
