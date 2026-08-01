import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { GroupMembershipResourceContextGuard } from './group-membership-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('GroupMembershipResourceContextGuard', () => {
  it('reads the target Person from the :personId route param', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest.fn().mockResolvedValue([]),
    };
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const guard = new GroupMembershipResourceContextGuard(
      branchConfigurationService as never,
      personRepository as never,
    );
    const actor: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personRepository.findById).toHaveBeenCalledWith('person-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1' },
    });
  });
});
