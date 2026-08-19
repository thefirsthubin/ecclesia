import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  SilentDriftFlagListForActorResourceContextGuard,
  SilentDriftFlagListResourceContextGuard,
} from './silent-drift-flag-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('SilentDriftFlagListResourceContextGuard', () => {
  it('resolves scope from the :groupId route param via GroupScopeService', async () => {
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new SilentDriftFlagListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'shepherd-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });
});

/** `[Silent-Drift Detection Branch-wide milestone]` */
describe('SilentDriftFlagListForActorResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
  const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };

  it('resolves scope via GroupScopeService when a groupId query param is present', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new SilentDriftFlagListForActorResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it("falls back to the actor's own Branch when no groupId query param is present, never taking branchId from the client", async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new SilentDriftFlagListForActorResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });

  it('[Milestone C] sets resource.bacentaId from the actor\'s own cluster when no groupId is present, so CLUSTER scope can actually be satisfied', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new SilentDriftFlagListForActorResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });
});
