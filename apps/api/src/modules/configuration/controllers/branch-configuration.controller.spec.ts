import type { ActorContext } from '@ecclesia/rbac';

import { BranchConfigurationController } from './branch-configuration.controller';

describe('BranchConfigurationController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildController() {
    const branchConfigurationCrudService = { getForBranch: jest.fn(), create: jest.fn(), update: jest.fn() };
    const controller = new BranchConfigurationController(branchConfigurationCrudService as never);
    return { controller, branchConfigurationCrudService };
  }

  it('get() delegates to BranchConfigurationCrudService.getForBranch with the actor\'s own Branch', async () => {
    const { controller, branchConfigurationCrudService } = buildController();

    await controller.get(actor);

    expect(branchConfigurationCrudService.getForBranch).toHaveBeenCalledWith('branch-1');
  });

  it('create() delegates to BranchConfigurationCrudService.create with the actor\'s own Branch and the parsed body', async () => {
    const { controller, branchConfigurationCrudService } = buildController();
    const body = { poimenGateEnabled: true } as never;

    await controller.create(actor, body);

    expect(branchConfigurationCrudService.create).toHaveBeenCalledWith('branch-1', body);
  });

  it('update() delegates to BranchConfigurationCrudService.update with the actor\'s own Branch and the parsed body', async () => {
    const { controller, branchConfigurationCrudService } = buildController();
    const body = { poimenGateEnabled: true } as never;

    await controller.update(actor, body);

    expect(branchConfigurationCrudService.update).toHaveBeenCalledWith('branch-1', body);
  });
});
