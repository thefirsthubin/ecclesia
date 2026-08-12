import type { ActorContext } from '@ecclesia/rbac';

import { AuditLogController } from './audit-log.controller';

describe('AuditLogController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const auditLogReadService = { listForActor: jest.fn() };
    const controller = new AuditLogController(auditLogReadService as never);
    return { controller, auditLogReadService };
  }

  it('list() delegates to AuditLogReadService.listForActor with the full ActorContext (role-dependent filtering)', async () => {
    const { controller, auditLogReadService } = buildController();
    auditLogReadService.listForActor.mockResolvedValue([]);

    await controller.list(actor);

    expect(auditLogReadService.listForActor).toHaveBeenCalledWith(actor);
  });
});
