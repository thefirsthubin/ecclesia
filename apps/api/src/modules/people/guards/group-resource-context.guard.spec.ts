import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  GroupCreateResourceContextGuard,
  GroupResourceContextGuard,
} from './group-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('GroupResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };

  it('throws NotFoundException when the target Group does not exist', async () => {
    const groupRepository = { findById: jest.fn().mockResolvedValue(null) };
    const guard = new GroupResourceContextGuard(branchConfigurationService as never, groupRepository as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('reports a PASTORAL_CARE Group’s own id as resource.bacentaId', async () => {
    const groupRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'bacenta-1', branchId: 'branch-1', type: 'PASTORAL_CARE' }),
    };
    const guard = new GroupResourceContextGuard(branchConfigurationService as never, groupRepository as never);
    const actor: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1', basontaId: undefined },
    });
  });

  it('reports a MINISTRY Group’s own id as resource.basontaId', async () => {
    const groupRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'basonta-1', branchId: 'branch-1', type: 'MINISTRY' }),
    };
    const guard = new GroupResourceContextGuard(branchConfigurationService as never, groupRepository as never);
    const actor: ActorContext = { personId: 'bsl-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'basonta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: undefined, basontaId: 'basonta-1' },
    });
  });
});

describe('GroupCreateResourceContextGuard', () => {
  it('resolves the resource as the actor’s own Branch, with no database read', async () => {
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const guard = new GroupCreateResourceContextGuard(branchConfigurationService as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
