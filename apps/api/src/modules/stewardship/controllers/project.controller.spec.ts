import type { ActorContext } from '@ecclesia/rbac';

import { ProjectController } from './project.controller';

describe('ProjectController', () => {
  const actor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const projectService = { create: jest.fn(), getById: jest.fn() };
    const controller = new ProjectController(projectService as never);
    return { controller, projectService };
  }

  it('create() delegates to ProjectService.create with the current actor', async () => {
    const { controller, projectService } = buildController();
    const body = { name: 'Building Fund', targetAmountMinor: '100000000' } as never;

    await controller.create(actor, body);

    expect(projectService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to ProjectService.getById', async () => {
    const { controller, projectService } = buildController();

    await controller.getById('proj-1');

    expect(projectService.getById).toHaveBeenCalledWith('proj-1');
  });
});
