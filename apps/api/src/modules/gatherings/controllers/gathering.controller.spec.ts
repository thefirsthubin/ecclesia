import type { ActorContext } from '@ecclesia/rbac';

import { GatheringController } from './gathering.controller';

describe('GatheringController', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const gatheringService = { create: jest.fn(), getById: jest.fn(), update: jest.fn() };
    const controller = new GatheringController(gatheringService as never);
    return { controller, gatheringService };
  }

  it('create() delegates to GatheringService.create with the current actor', async () => {
    const { controller, gatheringService } = buildController();
    const body = { type: 'SUNDAY_SERVICE', scheduledStart: '2026-08-02T09:00:00.000Z' } as never;

    await controller.create(actor, body);

    expect(gatheringService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to GatheringService.getById', async () => {
    const { controller, gatheringService } = buildController();

    await controller.getById('g-1');

    expect(gatheringService.getById).toHaveBeenCalledWith('g-1');
  });

  it('update() delegates to GatheringService.update', async () => {
    const { controller, gatheringService } = buildController();
    const body = { status: 'CANCELLED' } as never;

    await controller.update('g-1', body);

    expect(gatheringService.update).toHaveBeenCalledWith('g-1', body);
  });
});
