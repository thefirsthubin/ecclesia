import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { InsightsConsumer } from './insights.consumer';

describe('InsightsConsumer', () => {
  function buildConsumer() {
    const sqsClient = { send: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('https://sqs.example/insights-consumer') };
    const processedEventRepository = { tryRecord: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const engagementSignalRepository = { create: jest.fn() };
    const consumer = new InsightsConsumer(
      sqsClient as never,
      configService as never,
      processedEventRepository as never,
      logger as never,
      engagementSignalRepository as never,
    );
    return { consumer, engagementSignalRepository };
  }

  it('handle() writes every envelope to insights.engagement_signals, mapping subjectPersonId/subjectGroupId to personId/groupId', async () => {
    const { consumer, engagementSignalRepository } = buildConsumer();
    const envelope: EngagementSignalEnvelope = {
      eventId: '11111111-1111-1111-1111-111111111111',
      eventType: 'pastoral_care.silent_drift_flagged',
      schemaVersion: 1,
      branchId: '22222222-2222-2222-2222-222222222222',
      occurredAt: '2026-08-01T00:00:00.000Z',
      subjectPersonId: '33333333-3333-3333-3333-333333333333',
      subjectGroupId: '44444444-4444-4444-4444-444444444444',
      payload: { reason: 'no attendance in N weeks' },
    };

    // handle() is `protected` - invoked the same way the base class does internally.
    await (consumer as unknown as { handle(e: EngagementSignalEnvelope): Promise<void> }).handle(envelope);

    expect(engagementSignalRepository.create).toHaveBeenCalledWith({
      branchId: '22222222-2222-2222-2222-222222222222',
      personId: '33333333-3333-3333-3333-333333333333',
      groupId: '44444444-4444-4444-4444-444444444444',
      signalType: 'pastoral_care.silent_drift_flagged',
      payload: { reason: 'no attendance in N weeks' },
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    });
  });
});
