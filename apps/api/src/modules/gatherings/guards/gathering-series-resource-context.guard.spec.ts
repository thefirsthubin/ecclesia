import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  GatheringSeriesCreateResourceContextGuard,
  GatheringSeriesResourceContextGuard,
} from './gathering-series-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const actor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1' };

describe('GatheringSeriesCreateResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the body names a groupId', async () => {
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new GatheringSeriesCreateResourceContextGuard(branchConfigurationService as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the actor\'s own Branch when no groupId is supplied', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringSeriesCreateResourceContextGuard(branchConfigurationService as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});

describe('GatheringSeriesResourceContextGuard', () => {
  it('throws NotFoundException when the series does not exist', async () => {
    const gatheringSeriesRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new GatheringSeriesResourceContextGuard(
      branchConfigurationService as never,
      gatheringSeriesRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService when the series has a groupId', async () => {
    const gatheringSeriesRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'series-1', groupId: 'bacenta-1', branchId: 'branch-1' }),
    };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new GatheringSeriesResourceContextGuard(
      branchConfigurationService as never,
      gatheringSeriesRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'series-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });
});
