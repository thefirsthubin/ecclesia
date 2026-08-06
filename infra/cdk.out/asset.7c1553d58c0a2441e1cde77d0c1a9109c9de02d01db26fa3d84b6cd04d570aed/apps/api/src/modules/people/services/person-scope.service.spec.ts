import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PersonScopeService } from './person-scope.service';

describe('PersonScopeService', () => {
  it('throws NotFoundException when the target Person does not exist', async () => {
    const personRepository = { findById: jest.fn().mockResolvedValue(null), findActiveGroupMemberships: jest.fn() };
    const service = new PersonScopeService(personRepository as never);
    const actor: ActorContext = { personId: 'p1', role: 'ADMIN', branchId: 'branch-1' };

    await expect(service.loadResourceContext('missing', actor)).rejects.toThrow(NotFoundException);
  });

  it('resolves bacentaId from the Person’s active PASTORAL_CARE membership', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest
        .fn()
        .mockResolvedValue([{ id: 'm1', groupId: 'bacenta-1', groupType: 'PASTORAL_CARE' }]),
    };
    const service = new PersonScopeService(personRepository as never);
    const actor: ActorContext = { personId: 'bl-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

    const resource = await service.loadResourceContext('person-1', actor);

    expect(resource).toMatchObject({ branchId: 'branch-1', ownerId: 'person-1', bacentaId: 'bacenta-1' });
  });

  it('resolves basontaId only when the actor leads a Basonta the Person actively belongs to', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest
        .fn()
        .mockResolvedValue([{ id: 'm1', groupId: 'basonta-9', groupType: 'MINISTRY' }]),
    };
    const service = new PersonScopeService(personRepository as never);
    const nonMatchingActor: ActorContext = {
      personId: 'bsl-1',
      role: 'BASONTA_LEADER',
      branchId: 'branch-1',
      basontaId: 'basonta-1',
    };

    const resource = await service.loadResourceContext('person-1', nonMatchingActor);

    expect(resource.basontaId).toBeUndefined();
  });

  it('reports the actor-led basontaId when the Person actively belongs to it', async () => {
    const personRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'person-1', branchId: 'branch-1' }),
      findActiveGroupMemberships: jest
        .fn()
        .mockResolvedValue([{ id: 'm1', groupId: 'basonta-1', groupType: 'MINISTRY' }]),
    };
    const service = new PersonScopeService(personRepository as never);
    const matchingActor: ActorContext = {
      personId: 'bsl-1',
      role: 'BASONTA_LEADER',
      branchId: 'branch-1',
      basontaId: 'basonta-1',
    };

    const resource = await service.loadResourceContext('person-1', matchingActor);

    expect(resource.basontaId).toBe('basonta-1');
  });
});
