import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  PotentialCreateResourceContextGuard,
  PotentialListResourceContextGuard,
  PotentialResourceContextGuard,
} from './potential-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };

describe('[Milestone C.1.1] PotentialCreateResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the body names a groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new PotentialCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the actor\'s own scope shape (bacentaId/basontaId/cluster) when the body has no groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new PotentialCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' } });
  });
});

describe('[Milestone C.1.1] PotentialListResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when a groupId query param is present', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new PotentialListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the actor\'s own Branch when no groupId and no own group (Resident Pastor)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new PotentialListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});

describe('[Milestone C.1.1] PotentialResourceContextGuard', () => {
  it('throws NotFoundException when the Potential does not exist', async () => {
    const potentialRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new PotentialResourceContextGuard(branchConfigurationService as never, prisma as never, potentialRepository as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService from the Potential\'s own groupId when set', async () => {
    const potentialRepository = { findById: jest.fn().mockResolvedValue({ id: 'potential-1', branchId: 'branch-1', groupId: 'bacenta-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new PotentialResourceContextGuard(branchConfigurationService as never, prisma as never, potentialRepository as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'potential-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the Potential\'s own Branch when it has no groupId', async () => {
    const potentialRepository = { findById: jest.fn().mockResolvedValue({ id: 'potential-1', branchId: 'branch-1', groupId: null }) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new PotentialResourceContextGuard(branchConfigurationService as never, prisma as never, potentialRepository as never, groupScopeService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'potential-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
