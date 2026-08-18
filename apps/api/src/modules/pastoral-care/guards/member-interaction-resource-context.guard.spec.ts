import type { ExecutionContext } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { MemberInteractionResourceContextGuard } from './member-interaction-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const residentPastor: ActorContext = { personId: 'pastor-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

describe('[Milestone B] MemberInteractionResourceContextGuard', () => {
  it('resolves scope via PersonScopeService from the personId param', async () => {
    const personScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1' }) };
    const guard = new MemberInteractionResourceContextGuard(branchConfigurationService as never, prisma as never, personScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: residentPastor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', residentPastor);
  });
});
