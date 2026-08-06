import type { ActorContext } from '@ecclesia/rbac';

import { GatheringSeriesController } from './gathering-series.controller';

describe('GatheringSeriesController', () => {
  const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

  function buildController() {
    const gatheringSeriesService = { create: jest.fn(), getById: jest.fn() };
    const controller = new GatheringSeriesController(gatheringSeriesService as never);
    return { controller, gatheringSeriesService };
  }

  it('create() delegates to GatheringSeriesService.create with the current actor', async () => {
    const { controller, gatheringSeriesService } = buildController();
    const body = { type: 'BACENTA_MEETING', startDate: '2026-08-01' } as never;

    await controller.create(actor, body);

    expect(gatheringSeriesService.create).toHaveBeenCalledWith(actor, body);
  });

  it('getById() delegates to GatheringSeriesService.getById', async () => {
    const { controller, gatheringSeriesService } = buildController();

    await controller.getById('series-1');

    expect(gatheringSeriesService.getById).toHaveBeenCalledWith('series-1');
  });
});
