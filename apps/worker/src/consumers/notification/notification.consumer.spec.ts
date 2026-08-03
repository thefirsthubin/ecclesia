import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { NotificationConsumer } from './notification.consumer';

describe('NotificationConsumer', () => {
  function buildConsumer() {
    const sqsClient = { send: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('https://sqs.example/notification-consumer') };
    const processedEventRepository = { tryRecord: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const consumer = new NotificationConsumer(
      sqsClient as never,
      configService as never,
      processedEventRepository as never,
      logger as never,
      prisma as never,
    );
    return { consumer, logger };
  }

  it('handle() logs the envelope without writing to any table (idempotency-check-and-log stub)', async () => {
    const { consumer, logger } = buildConsumer();
    const envelope: EngagementSignalEnvelope = {
      eventId: '11111111-1111-1111-1111-111111111111',
      eventType: 'pastoral_care.silent_drift_flagged',
      schemaVersion: 1,
      branchId: '22222222-2222-2222-2222-222222222222',
      occurredAt: '2026-08-01T00:00:00.000Z',
      subjectPersonId: '33333333-3333-3333-3333-333333333333',
      payload: {},
    };

    await (consumer as unknown as { handle(e: EngagementSignalEnvelope): Promise<void> }).handle(envelope);

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: envelope.eventId, eventType: envelope.eventType, subjectPersonId: envelope.subjectPersonId }),
      expect.stringContaining('no delivery channel is configured'),
    );
  });
});
