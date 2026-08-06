import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { RoleAssignmentResourceContextGuard } from './role-assignment-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('RoleAssignmentResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };

  it('delegates resource resolution to PersonScopeService, keyed on the :personId param', async () => {
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new RoleAssignmentResourceContextGuard(branchConfigurationService as never, personScopeService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' },
    });
  });

  it('propagates a NotFoundException from PersonScopeService unchanged', async () => {
    const notFound = new Error('No Person found');
    const personScopeService = { loadResourceContext: jest.fn().mockRejectedValue(notFound) };
    const guard = new RoleAssignmentResourceContextGuard(branchConfigurationService as never, personScopeService as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(notFound);
  });
});
