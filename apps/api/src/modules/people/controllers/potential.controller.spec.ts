import type { ActorContext } from '@ecclesia/rbac';

import { PotentialController } from './potential.controller';

describe('[Milestone C.1.1] PotentialController', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildController() {
    const potentialService = { create: jest.fn(), getById: jest.fn(), list: jest.fn(), update: jest.fn() };
    const controller = new PotentialController(potentialService as never);
    return { controller, potentialService };
  }

  it('create() delegates to PotentialService.create with the actor and parsed body', async () => {
    const { controller, potentialService } = buildController();
    const body = { groupId: 'bacenta-1', firstName: 'Kwabena', source: 'REFERRAL' } as never;

    await controller.create(actor, body);

    expect(potentialService.create).toHaveBeenCalledWith(actor, body);
  });

  it('list() delegates to PotentialService.list with the actor and parsed query', async () => {
    const { controller, potentialService } = buildController();
    const query = { groupId: 'bacenta-1' } as never;

    await controller.list(actor, query);

    expect(potentialService.list).toHaveBeenCalledWith(actor, query);
  });

  it('getById() delegates to PotentialService.getById', async () => {
    const { controller, potentialService } = buildController();

    await controller.getById('potential-1');

    expect(potentialService.getById).toHaveBeenCalledWith('potential-1');
  });

  it('update() delegates to PotentialService.update with the id and parsed body', async () => {
    const { controller, potentialService } = buildController();
    const body = { status: 'CONVERTED' } as never;

    await controller.update('potential-1', body);

    expect(potentialService.update).toHaveBeenCalledWith('potential-1', body);
  });
});
