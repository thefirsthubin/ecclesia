import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import { AuditConsumer } from './audit.consumer';

describe('AuditConsumer', () => {
  function buildConsumer() {
    const sqsClient = { send: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue('https://sqs.example/audit-consumer') };
    const processedEventRepository = { tryRecord: jest.fn() };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const auditLogRepository = { record: jest.fn() };
    const consumer = new AuditConsumer(
      sqsClient as never,
      configService as never,
      processedEventRepository as never,
      logger as never,
      auditLogRepository as never,
    );
    return { consumer, auditLogRepository };
  }

  it('handle() writes every envelope to platform.audit_log with eventType as the action and no actorUserId', async () => {
    const { consumer, auditLogRepository } = buildConsumer();
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

    expect(auditLogRepository.record).toHaveBeenCalledWith({
      branchId: '22222222-2222-2222-2222-222222222222',
      action: 'pastoral_care.silent_drift_flagged',
      resourceType: 'EngagementSignal',
      resourceId: '11111111-1111-1111-1111-111111111111',
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    });
  });
});
