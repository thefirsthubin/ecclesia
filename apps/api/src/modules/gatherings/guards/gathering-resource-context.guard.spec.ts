import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  GatheringCreateResourceContextGuard,
  GatheringListResourceContextGuard,
  GatheringResourceContextGuard,
} from './gathering-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

describe('GatheringCreateResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the body names an ownerGroupId', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new GatheringCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: { ownerGroupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it('falls back to the actor\'s own Branch for a Branch-wide Gathering (no ownerGroupId)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});

describe('GatheringResourceContextGuard', () => {
  it('throws NotFoundException when the Gathering does not exist', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService when the Gathering has an ownerGroupId', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue({ id: 'g-1', ownerGroupId: 'bacenta-1', branchId: 'branch-1' }) };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new GatheringResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'g-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('resolves to just the Gathering\'s own branchId when ownerGroupId is null (Branch-wide Gathering)', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue({ id: 'g-1', ownerGroupId: null, branchId: 'branch-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'g-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});

describe('GatheringListResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when an ownerGroupId query param is present (Shepherd Dashboard sprint)', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new GatheringListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: { ownerGroupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it('falls back to the actor\'s own Branch when no ownerGroupId query param is present (Gatherings Web Admin sprint)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
