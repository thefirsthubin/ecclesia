import type { ActorContext } from '@ecclesia/rbac';

import { GivingTrendController } from './giving-trend.controller';

describe('[Milestone C] GivingTrendController', () => {
  const actor: ActorContext = { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' };

  it('getGivingTrend() delegates to GivingTrendService.getTrend with the actor and parsed query', async () => {
    const givingTrendService = { getTrend: jest.fn() };
    const controller = new GivingTrendController(givingTrendService as never);
    const query = { granularity: 'month', count: 6, council: false } as never;

    await controller.getGivingTrend(actor, query);

    expect(givingTrendService.getTrend).toHaveBeenCalledWith(actor, query);
  });
});
