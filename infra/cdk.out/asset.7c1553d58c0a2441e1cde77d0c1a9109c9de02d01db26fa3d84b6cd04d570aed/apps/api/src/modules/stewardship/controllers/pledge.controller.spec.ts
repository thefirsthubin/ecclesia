import type { ActorContext } from '@ecclesia/rbac';

import { PledgeController } from './pledge.controller';

describe('PledgeController', () => {
  const actor: ActorContext = { personId: 'member-1', role: 'MEMBER', branchId: 'branch-1' };

  function buildController() {
    const pledgeService = { create: jest.fn(), getById: jest.fn(), fulfill: jest.fn() };
    const controller = new PledgeController(pledgeService as never);
    return { controller, pledgeService };
  }

  it('create() delegates to PledgeService.create with the current actor', async () => {
    const { controller, pledgeService } = buildController();
    const body = { projectId: 'proj-1', pledgedAmountMinor: '50000' } as never;

    await controller.create(actor, body);

    expect(pledgeService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to PledgeService.getById', async () => {
    const { controller, pledgeService } = buildController();

    await controller.getById('pledge-1');

    expect(pledgeService.getById).toHaveBeenCalledWith('pledge-1');
  });

  it('fulfill() delegates to PledgeService.fulfill', async () => {
    const { controller, pledgeService } = buildController();
    const body = { fulfilledTransactionId: 'ft-1' } as never;

    await controller.fulfill('pledge-1', body);

    expect(pledgeService.fulfill).toHaveBeenCalledWith('pledge-1', body);
  });
});
