import { NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ECCLESIA_REQUEST_CONTEXT_KEY } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { PersonCreateResourceContextGuard, PersonResourceContextGuard } from './person-resource-context.guard';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

function buildContext(request: Partial<RequestWithActorContext>): ExecutionContext {
  return { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext;
}

describe('PersonResourceContextGuard', () => {
  const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };

  it('throws NotFoundException when the target Person does not exist', async () => {
    const personRepository = { findById: jest.fn().mockResolvedValue(null), findActiveGroupMemberships: jest.fn() };
    const guard = new PersonResourceContextGuard(branchConfigurationService as never, personRepository as never);
    const actor: ActorContext = { personId: 'p1', role: 'ADMIN', branchId: 'branch-1' };
    const context = buildContext({ actorContext: actor, params: { id: 'missing' } } as never);

    await expect(guard.canActivate(context)).rejects.toThrow(NotFoundException);
  });

  it('resolves bacentaId from the Person’s active PASTORAL_CARE membership', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest
        .fn()
        .mockResolvedValue([{ id: 'm1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' }]),
    };
    const guard = new PersonResourceContextGuard(branchConfigurationService as never, personRepository as never);
    const actor: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor, params: { id: 'person-1' } } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' },
    });
  });

  it('resolves basontaId only when the actor leads a Basonta the Person actively belongs to', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest
        .fn()
        .mockResolvedValue([{ id: 'm1', groupId: 'basonta-9', groupType: 'MINISTRY' }]),
    };
    const guard = new PersonResourceContextGuard(branchConfigurationService as never, personRepository as never);
    const nonMatchingActor: ActorContext = {
      personId: 'bsl-1',
      role: 'BASONTA_LEADER',
      branchId: 'branch-1',
      basontaId: 'basonta-1',
    };
    const request: Partial<RequestWithActorContext> = {
      actorContext: nonMatchingActor,
      params: { id: 'person-1' },
    } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { basontaId: undefined },
    });
  });
});

describe('PersonCreateResourceContextGuard', () => {
  it('resolves the resource as the actor’s own Branch, with no database read', async () => {
    const branchConfigurationService = { loadForBranch: jest.fn().mockResolvedValue({ poimenGateEnabled: false }) };
    const guard = new PersonCreateResourceContextGuard(branchConfigurationService as never);
    const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };
    const request: Partial<RequestWithActorContext> = { actorContext: actor } as never;

    await guard.canActivate(buildContext(request));

    expect((request as Record<string, unknown>)[ECCLESIA_REQUEST_CONTEXT_KEY]).toMatchObject({
      resource: { branchId: 'branch-1' },
    });
  });
});
