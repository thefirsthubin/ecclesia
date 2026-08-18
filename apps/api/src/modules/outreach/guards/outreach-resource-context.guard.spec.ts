import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  OutreachCreateResourceContextGuard,
  OutreachListResourceContextGuard,
  OutreachResourceContextGuard,
} from './outreach-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

describe('[Milestone B] OutreachCreateResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the body names a groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new OutreachCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, body: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the actor\'s own Branch when no groupId is given', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachCreateResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, body: {} } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});

describe('[Milestone B] OutreachListResourceContextGuard', () => {
  it('resolves scope via GroupScopeService when the query names a groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new OutreachListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, query: { groupId: 'bacenta-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the actor\'s own Branch when the query has no groupId', async () => {
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachListResourceContextGuard(branchConfigurationService as never, prisma as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, query: {} } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});

describe('[Milestone B] OutreachResourceContextGuard', () => {
  it('throws NotFoundException when the Outreach does not exist', async () => {
    const outreachRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachResourceContextGuard(branchConfigurationService as never, prisma as never, outreachRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope via GroupScopeService when the Outreach has a groupId', async () => {
    const outreachRepository = { findById: jest.fn().mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1', groupId: 'bacenta-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new OutreachResourceContextGuard(branchConfigurationService as never, prisma as never, outreachRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'outreach-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });

  it('falls back to the Outreach\'s own branchId when it has no groupId', async () => {
    const outreachRepository = { findById: jest.fn().mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1', groupId: null }) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachResourceContextGuard(branchConfigurationService as never, prisma as never, outreachRepository as never, groupScopeService as never);
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'outreach-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
