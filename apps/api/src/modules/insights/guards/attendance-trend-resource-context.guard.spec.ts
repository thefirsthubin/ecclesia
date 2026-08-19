import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceTrendResourceContextGuard } from './attendance-trend-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };

describe('[Milestone C] AttendanceTrendResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when a groupId query param is present', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new AttendanceTrendResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('sets resource.bacentaId from the actor\'s own cluster for a CLUSTER-scoped actor', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AttendanceTrendResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1'] };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' } });
  });

  it('resolves to just the actor\'s own Branch for a BRANCH-scoped actor', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AttendanceTrendResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
