import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { GroupMembershipResourceContextGuard } from './group-membership-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('GroupMembershipResourceContextGuard', () => {
  it('reads the target Person from the :personId route param via PersonScopeService', async () => {
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }),
    };
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const guard = new GroupMembershipResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      personScopeService as never,
    );
    const actor: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1' },
    });
  });
});
