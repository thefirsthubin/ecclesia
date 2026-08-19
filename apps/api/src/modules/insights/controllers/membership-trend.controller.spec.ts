import type { ActorContext } from '@ecclesia/rbac';

import { MembershipTrendController } from './membership-trend.controller';

describe('[Milestone C] MembershipTrendController', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  it('getMembershipTrend() delegates to MembershipTrendService.getTrend with the actor and parsed query', async () => {
    const membershipTrendService = { getTrend: jest.fn() };
    const controller = new MembershipTrendController(membershipTrendService as never);
    const query = { granularity: 'month', count: 6, council: false } as never;

    await controller.getMembershipTrend(actor, query);

    expect(membershipTrendService.getTrend).toHaveBeenCalledWith(actor, query);
  });
});
