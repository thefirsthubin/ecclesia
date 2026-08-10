import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { AttendanceResourceContextGuard } from './attendance-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const actor: ActorContext = { personId: 'usher-1', role: 'BACENTA_LEADER', branchId: 'branch-1' };

describe('AttendanceResourceContextGuard', () => {
  it('throws NotFoundException when the :gatheringId Gathering does not exist', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AttendanceResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { gatheringId: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService when the Gathering has an ownerGroupId', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue({ id: 'g-1', ownerGroupId: 'bacenta-1', branchId: 'branch-1' }) };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new AttendanceResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { gatheringId: 'g-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it('resolves to just the Gathering\'s own branchId for a Branch-wide Gathering', async () => {
    const gatheringRepository = { findById: jest.fn().mockResolvedValue({ id: 'g-1', ownerGroupId: null, branchId: 'branch-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new AttendanceResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      gatheringRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { gatheringId: 'g-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
