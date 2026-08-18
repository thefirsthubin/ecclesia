import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import {
  OutreachContactCreateResourceContextGuard,
  OutreachContactResourceContextGuard,
} from './outreach-contact-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

describe('[Milestone B] OutreachContactCreateResourceContextGuard', () => {
  it('throws NotFoundException when the parent Outreach does not exist', async () => {
    const outreachRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachContactCreateResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { outreachId: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope from the parent Outreach\'s own groupId', async () => {
    const outreachRepository = { findById: jest.fn().mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1', groupId: 'bacenta-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new OutreachContactCreateResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { outreachId: 'outreach-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
  });
});

describe('[Milestone B] OutreachContactResourceContextGuard', () => {
  it('throws NotFoundException when the contact does not exist', async () => {
    const outreachContactRepository = { findById: jest.fn().mockResolvedValue(null) };
    const outreachRepository = { findById: jest.fn() };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachContactResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachContactRepository as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when the parent Outreach does not exist', async () => {
    const outreachContactRepository = { findById: jest.fn().mockResolvedValue({ id: 'contact-1', outreachId: 'outreach-missing' }) };
    const outreachRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachContactResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachContactRepository as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'contact-1' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it('resolves scope through the contact -> parent Outreach -> Group chain', async () => {
    const outreachContactRepository = { findById: jest.fn().mockResolvedValue({ id: 'contact-1', outreachId: 'outreach-1' }) };
    const outreachRepository = { findById: jest.fn().mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1', groupId: 'bacenta-1' }) };
    const groupScopeService = { loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }) };
    const guard = new OutreachContactResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachContactRepository as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'contact-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' } });
  });

  it('falls back to the parent Outreach\'s own branchId when it has no groupId', async () => {
    const outreachContactRepository = { findById: jest.fn().mockResolvedValue({ id: 'contact-1', outreachId: 'outreach-1' }) };
    const outreachRepository = { findById: jest.fn().mockResolvedValue({ id: 'outreach-1', branchId: 'branch-1', groupId: null }) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new OutreachContactResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      outreachContactRepository as never,
      outreachRepository as never,
      groupScopeService as never,
    );
    const request: Partial<RequestWithActorContext> = { actorContext: bacentaLeader, params: { id: 'contact-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({ resource: { branchId: 'branch-1' } });
  });
});
