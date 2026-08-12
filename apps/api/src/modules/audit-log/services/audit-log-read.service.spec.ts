import type { ActorContext } from '@ecclesia/rbac';
import type { AuditLog } from '@prisma/client';

import type { AuditLogReadRepository } from '../repositories/audit-log-read.repository';
import { AuditLogReadService } from './audit-log-read.service';

function buildRow(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 'row-1',
    branchId: 'branch-1',
    actorUserId: 'user-1',
    action: 'stewardship.transaction.verify',
    effect: 'ALLOW',
    resourceType: 'FinancialTransaction',
    resourceId: 'txn-1',
    reason: null,
    deviceId: null,
    ipAddress: null,
    occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  } as AuditLog;
}

describe('AuditLogReadService', () => {
  function buildService() {
    const repository = { findForBranch: jest.fn() } as unknown as jest.Mocked<AuditLogReadRepository>;
    const service = new AuditLogReadService(repository);
    return { service, repository };
  }

  it('lists rows for the actor Branch and maps them to the response DTO shape', async () => {
    const { service, repository } = buildService();
    (repository.findForBranch as jest.Mock).mockResolvedValue([buildRow()]);
    const actor: ActorContext = { personId: 'p1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

    const result = await service.listForActor(actor);

    expect(repository.findForBranch).toHaveBeenCalledWith('branch-1', undefined);
    expect(result).toEqual([
      {
        id: 'row-1',
        branchId: 'branch-1',
        actorUserId: 'user-1',
        action: 'stewardship.transaction.verify',
        effect: 'ALLOW',
        resourceType: 'FinancialTransaction',
        resourceId: 'txn-1',
        reason: null,
        deviceId: null,
        ipAddress: null,
        occurredAt: '2026-08-01T00:00:00.000Z',
      },
    ]);
  });

  it("passes the 'stewardship.' action-prefix filter for TREASURER, per PRD §17.3", async () => {
    const { service, repository } = buildService();
    (repository.findForBranch as jest.Mock).mockResolvedValue([]);
    const actor: ActorContext = { personId: 'p1', role: 'TREASURER', branchId: 'branch-1' };

    await service.listForActor(actor);

    expect(repository.findForBranch).toHaveBeenCalledWith('branch-1', 'stewardship.');
  });

  it('passes no action-prefix filter for ADMIN (full view per PRD §17.3)', async () => {
    const { service, repository } = buildService();
    (repository.findForBranch as jest.Mock).mockResolvedValue([]);
    const actor: ActorContext = { personId: 'p1', role: 'ADMIN', branchId: 'branch-1' };

    await service.listForActor(actor);

    expect(repository.findForBranch).toHaveBeenCalledWith('branch-1', undefined);
  });
});
