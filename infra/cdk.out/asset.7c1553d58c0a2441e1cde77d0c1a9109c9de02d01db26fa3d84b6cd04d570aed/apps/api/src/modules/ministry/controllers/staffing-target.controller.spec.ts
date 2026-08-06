import type { ActorContext } from '@ecclesia/rbac';

import { StaffingTargetController } from './staffing-target.controller';

describe('StaffingTargetController', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };

  function buildController() {
    const staffingTargetService = { create: jest.fn(), getById: jest.fn() };
    const controller = new StaffingTargetController(staffingTargetService as never);
    return { controller, staffingTargetService };
  }

  it('create() delegates to StaffingTargetService.create with the current actor', async () => {
    const { controller, staffingTargetService } = buildController();
    const body = { gatheringId: 'gathering-1', groupId: 'basonta-1', targetCount: 8 } as never;

    await controller.create(actor, body);

    expect(staffingTargetService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to StaffingTargetService.getById', async () => {
    const { controller, staffingTargetService } = buildController();

    await controller.getById('target-1');

    expect(staffingTargetService.getById).toHaveBeenCalledWith('target-1');
  });
});
