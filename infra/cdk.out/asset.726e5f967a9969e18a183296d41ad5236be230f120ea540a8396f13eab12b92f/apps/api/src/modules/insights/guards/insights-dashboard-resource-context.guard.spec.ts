import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { BranchDashboardResourceContextGuard, GroupDashboardResourceContextGuard } from './insights-dashboard-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const residentPastor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

describe('BranchDashboardResourceContextGuard', () => {
  it('resolves to { branchId: actor.branchId }, ignoring any route params', async () => {
    const guard = new BranchDashboardResourceContextGuard(branchConfigurationService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});

describe('GroupDashboardResourceContextGuard', () => {
  it('delegates to GroupScopeService.loadResourceContext(groupId)', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'group-1' }),
    };
    const guard = new GroupDashboardResourceContextGuard(branchConfigurationService as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor, params: { groupId: 'group-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('group-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'group-1' },
    });
  });
});
