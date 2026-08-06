import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { VisitorIntakeResourceContextGuard } from './visitor-intake-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

describe('VisitorIntakeResourceContextGuard', () => {
  it('prefers the named gatheringId\'s own scope when supplied', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue({ id: 'g-1', ownerGroupId: 'bacenta-1', branchId: 'branch-1' }) };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new VisitorIntakeResourceContextGuard(
      branchConfigurationService as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = {
      actorContext: actor,
      body: { gatheringId: 'g-1', bacentaPreferenceGroupId: 'other-bacenta' },
    } as never;

    await guard.canActivate(buildContext(request));

    expect(gatheringRepository.findById).toHaveBeenCalledWith('g-1');
    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it('falls back to bacentaPreferenceGroupId when no gatheringId is supplied', async () => {
    const gatheringRepository = { findById: jest.fn() };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-2' }),
    };
    const guard = new VisitorIntakeResourceContextGuard(
      branchConfigurationService as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = {
      actorContext: actor,
      body: { bacentaPreferenceGroupId: 'bacenta-2' },
    } as never;

    await guard.canActivate(buildContext(request));

    expect(gatheringRepository.findById).not.toHaveBeenCalled();
    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-2');
  });

  it('falls through to bacentaPreferenceGroupId when the named gatheringId does not resolve to a Gathering', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-2' }),
    };
    const guard = new VisitorIntakeResourceContextGuard(
      branchConfigurationService as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = {
      actorContext: actor,
      body: { gatheringId: 'missing', bacentaPreferenceGroupId: 'bacenta-2' },
    } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-2');
  });

  it('falls back to the actor\'s own Branch when neither gatheringId nor a Bacenta preference is supplied', async () => {
    const gatheringRepository = { findById: jest.fn() };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new VisitorIntakeResourceContextGuard(
      branchConfigurationService as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
