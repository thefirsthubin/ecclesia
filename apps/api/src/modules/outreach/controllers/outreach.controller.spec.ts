import type { ActorContext } from '@ecclesia/rbac';

import { OutreachController } from './outreach.controller';

describe('[Milestone B] OutreachController', () => {
  const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  function buildController() {
    const outreachService = { create: jest.fn(), list: jest.fn(), getById: jest.fn() };
    const controller = new OutreachController(outreachService as never);
    return { controller, outreachService };
  }

  it('create() delegates to OutreachService.create with the current actor', async () => {
    const { controller, outreachService } = buildController();
    const body = { occurredAt: '2026-08-15T09:00:00.000Z', leaderPersonId: 'leader-1' } as never;

    await controller.create(actor, body);

    expect(outreachService.create).toHaveBeenCalledWith(actor, body);
  });

  it('list() delegates to OutreachService.list with the current actor and query', async () => {
    const { controller, outreachService } = buildController();
    const query = { groupId: 'bacenta-1' } as never;

    await controller.list(actor, query);

    expect(outreachService.list).toHaveBeenCalledWith(actor, query);
  });

  it('getById() delegates to OutreachService.getById', async () => {
    const { controller, outreachService } = buildController();

    await controller.getById('outreach-1');

    expect(outreachService.getById).toHaveBeenCalledWith('outreach-1');
  });
});
