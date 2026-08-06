import type { ActorContext } from '@ecclesia/rbac';

import { AlertController } from './alert.controller';

describe('AlertController', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'group-1' };

  function buildController() {
    const alertService = { getById: jest.fn(), resolve: jest.fn() };
    const controller = new AlertController(alertService as never);
    return { controller, alertService };
  }

  it('getById() delegates to AlertService.getById', async () => {
    const { controller, alertService } = buildController();

    await controller.getById('alert-1');

    expect(alertService.getById).toHaveBeenCalledWith('alert-1');
  });

  it('resolve() attributes resolution to the current actor, never a client-supplied resolver', async () => {
    const { controller, alertService } = buildController();
    const body = { status: 'ACTED' as const };

    await controller.resolve(actor, 'alert-1', body);

    expect(alertService.resolve).toHaveBeenCalledWith('leader-1', 'alert-1', body);
  });
});
