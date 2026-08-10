import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  StaffingTargetCreateResourceContextGuard,
  StaffingTargetResourceContextGuard,
} from './staffing-target-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const basontaLeader: ActorContext = { personId: 'leader-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };

describe('StaffingTargetCreateResourceContextGuard', () => {
  it('throws NotFoundException when the request body has no groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new StaffingTargetCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: basontaLeader, body: {} } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('delegates to GroupScopeService.loadResourceContext(body.groupId)', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', basontaId: 'basonta-1' }) };
    const guard = new StaffingTargetCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: basontaLeader, body: { groupId: 'basonta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('basonta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', basontaId: 'basonta-1' },
    });
  });
});

describe('StaffingTargetResourceContextGuard', () => {
  it('throws NotFoundException when the Staffing Target does not exist', async () => {
    const staffingTargetRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new StaffingTargetResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      staffingTargetRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: basontaLeader, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via the target Staffing Target\'s own groupId', async () => {
    const staffingTargetRepository = { findById: jest.fn().mockResolvedValue({ id: 'target-1', groupId: 'basonta-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', basontaId: 'basonta-1' }) };
    const guard = new StaffingTargetResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      staffingTargetRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: basontaLeader, params: { id: 'target-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('basonta-1');
  });
});
