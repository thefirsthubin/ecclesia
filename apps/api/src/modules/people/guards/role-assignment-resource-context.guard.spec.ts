import type { ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { RoleAssignmentResourceContextGuard, RoleAssignmentRevokeResourceContextGuard } from './role-assignment-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('RoleAssignmentResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
  const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };

  it('delegates resource resolution to PersonScopeService, keyed on the :personId param', async () => {
    const personScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new RoleAssignmentResourceContextGuard(branchConfigurationService as never, prisma as never, personScopeService as never);
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(personScopeService.loadResourceContext).toHaveBeenCalledWith('person-1', actor);
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' },
    });
  });

  it('propagates a NotFoundException from PersonScopeService unchanged', async () => {
    const notFound = new Error('No Person found');
    const personScopeService = { loadResourceContext: jest.fn().mockRejectedValue(notFound) };
    const guard = new RoleAssignmentResourceContextGuard(branchConfigurationService as never, prisma as never, personScopeService as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(notFound);
  });
});

/** `[Role Assignment Revoke milestone]` */
describe('RoleAssignmentRevokeResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
  const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };

  it("resolves scope from the assignment's own groupId via GroupScopeService when one exists", async () => {
    const roleAssignmentRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'ra-1', personId: 'person-1', branchId: 'branch-1', groupId: 'bacenta-1' }),
    };
    const groupScopeService = {
      loadResourceContext: jest.fn().mockResolvedValue({ branchId: 'branch-1', bacentaId: 'bacenta-1' }),
    };
    const guard = new RoleAssignmentRevokeResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      roleAssignmentRepository as never,
      groupScopeService as never,
    );
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1', assignmentId: 'ra-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).toHaveBeenCalledWith('bacenta-1');
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', bacentaId: 'bacenta-1' },
    });
  });

  it('falls back to the branch alone when the assignment has no groupId, with no database read via GroupScopeService', async () => {
    const roleAssignmentRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'ra-1', personId: 'person-1', branchId: 'branch-1', groupId: null }),
    };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new RoleAssignmentRevokeResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      roleAssignmentRepository as never,
      groupScopeService as never,
    );
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1', assignmentId: 'ra-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect(groupScopeService.loadResourceContext).not.toHaveBeenCalled();
    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });

  it('throws NotFoundException when the assignment does not exist', async () => {
    const roleAssignmentRepository = { findById: jest.fn().mockResolvedValue(null) };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new RoleAssignmentRevokeResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      roleAssignmentRepository as never,
      groupScopeService as never,
    );
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1', assignmentId: 'missing' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });

  it("throws NotFoundException when the assignment belongs to a different Person than the route's :personId", async () => {
    const roleAssignmentRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'ra-1', personId: 'someone-else', branchId: 'branch-1', groupId: null }),
    };
    const groupScopeService = { loadResourceContext: jest.fn() };
    const guard = new RoleAssignmentRevokeResourceContextGuard(
      branchConfigurationService as never,
      prisma as never,
      roleAssignmentRepository as never,
      groupScopeService as never,
    );
    const actor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { personId: 'person-1', assignmentId: 'ra-1' } } as never;

    await expect(guard.canActivate(buildContext(request))).rejects.toThrow(NotFoundException);
  });
});
