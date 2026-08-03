import type { ActorContext } from '@ecclesia/rbac';

import { GroupController } from './group.controller';

describe('GroupController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildController() {
    const groupService = { create: jest.fn(), getById: jest.fn(), update: jest.fn(), list: jest.fn() };
    const controller = new GroupController(groupService as never);
    return { controller, groupService };
  }

  it('create() delegates to GroupService.create with the current actor', async () => {
    const { controller, groupService } = buildController();
    const body = { type: 'PASTORAL_CARE', name: 'Grace Bacenta' } as never;

    await controller.create(actor, body);

    expect(groupService.create).toHaveBeenCalledWith(actor, body);
  });

  it('list() delegates to GroupService.list with the current actor and parsed query (Ministry Web Admin sprint)', async () => {
    const { controller, groupService } = buildController();
    const query = { type: 'MINISTRY' } as never;

    await controller.list(actor, query);

    expect(groupService.list).toHaveBeenCalledWith(actor, query);
  });

  it('getById() delegates to GroupService.getById', async () => {
    const { controller, groupService } = buildController();

    await controller.getById('group-1');

    expect(groupService.getById).toHaveBeenCalledWith('group-1');
  });

  it('update() delegates to GroupService.update', async () => {
    const { controller, groupService } = buildController();
    const body = { name: 'Renamed Bacenta' } as never;

    await controller.update('group-1', body);

    expect(groupService.update).toHaveBeenCalledWith('group-1', body);
  });
});
