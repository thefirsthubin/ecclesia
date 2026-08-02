import { WorkerAuditLogRepository } from './audit-log.repository';

describe('WorkerAuditLogRepository', () => {
  it('record() creates a platform.audit_log row with the given fields', async () => {
    const prisma = { auditLog: { create: jest.fn().mockResolvedValue({ id: 'log-1' }) } };
    const repository = new WorkerAuditLogRepository(prisma as never);

    await repository.record({
      branchId: 'branch-1',
      action: 'pastoral_care.silent_drift_flagged',
      resourceType: 'EngagementSignal',
      resourceId: 'event-1',
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        action: 'pastoral_care.silent_drift_flagged',
        resourceType: 'EngagementSignal',
        resourceId: 'event-1',
        occurredAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    });
  });
});
