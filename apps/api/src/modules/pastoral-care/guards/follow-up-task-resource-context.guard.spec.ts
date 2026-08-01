import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  FollowUpTaskCreateResourceContextGuard,
  FollowUpTaskResourceContextGuard,
} from './follow-up-task-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('FollowUpTaskCreateResourceContextGuard', () => {
  it('resolves the subject Person from the :personId route param via PersonScopeService', async () => {
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const guard = new FollowUpTaskCreateResourceContextGuard(branchConfigurationService as never, personScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });
});

describe('FollowUpTaskResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };

  it('throws NotFoundException when the target task does not exist', async () => {
    const followUpTaskRepository = { findById: jest.fn().mockResolvedValue(null) };
    const personScopeService = { loadResourceContext: jest.fn() };
    const guard = new FollowUpTaskResourceContextGuard(
      branchConfigurationService as never,
      followUpTaskRepository as never,
      personScopeService as never,
    );
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope from the task\'s subject Person via PersonScopeService', async () => {
    const followUpTaskRepository = { findById: jest.fn().mockResolvedValue({ id: 'ft-1', personId: 'person-1' }) };
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new FollowUpTaskResourceContextGuard(
      branchConfigurationService as never,
      followUpTaskRepository as never,
      personScopeService as never,
    );
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'ft-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });
});
