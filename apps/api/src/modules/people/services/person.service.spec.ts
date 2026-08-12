import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PersonService } from './person.service';

describe('PersonService', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildService() {
    const personRepository = {
      findDuplicateCandidateSet: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      updateLifecycleStage: jest.fn(),
      findByBranch: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      countByBranch: jest.fn(),
      countByBranchCreatedBefore: jest.fn(),
    };
    const groupRosterService = {
      listActiveMembers: jest.fn().mockResolvedValue([]),
    };
    const eventPublisher = { publish: jest.fn() };
    const service = new PersonService(personRepository as never, groupRosterService as never, eventPublisher as never);
    return { service, personRepository, groupRosterService, eventPublisher };
  }

  const personRow = {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'VISITOR',
    guardianPersonId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  describe('create', () => {
    it('creates the Person and returns a mapped response when no duplicate is found', async () => {
      const { service, personRepository } = buildService();
      personRepository.create.mockResolvedValue(personRow);

      const result = await service.create(actor, {
        firstName: 'Ama',
        lastName: 'Owusu',
        overrideDuplicateCheck: false,
      });

      expect(personRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', firstName: 'Ama', lastName: 'Owusu' }),
      );
      expect(result.id).toBe('person-1');
      expect(result.lifecycleStage).toBe('VISITOR');
    });

    it('throws ConflictException with candidates when a duplicate is found and not overridden', async () => {
      const { service, personRepository } = buildService();
      personRepository.findDuplicateCandidateSet.mockResolvedValue([
        { id: 'existing-1', firstName: 'Ama', lastName: 'Owusu', phone: '+233555000111', dateOfBirth: null, activeBacentaGroupId: null },
      ]);

      await expect(
        service.create(actor, {
          firstName: 'Ama',
          lastName: 'Owusu',
          phone: '+233555000111',
          overrideDuplicateCheck: false,
        }),
      ).rejects.toThrow(ConflictException);
      expect(personRepository.create).not.toHaveBeenCalled();
    });

    it('skips the duplicate check entirely when overrideDuplicateCheck is true', async () => {
      const { service, personRepository } = buildService();
      personRepository.create.mockResolvedValue(personRow);

      await service.create(actor, { firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: true });

      expect(personRepository.findDuplicateCandidateSet).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates and returns the mapped Person when it exists', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue(personRow);
      personRepository.update.mockResolvedValue({ ...personRow, phone: '+233555000111' });

      const result = await service.update('person-1', { phone: '+233555000111' });

      expect(personRepository.update).toHaveBeenCalledWith('person-1', expect.objectContaining({ phone: '+233555000111' }));
      expect(result.phone).toBe('+233555000111');
    });

    it('throws NotFoundException rather than surfacing a raw Prisma error when the Person does not exist', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { phone: '+233555000111' })).rejects.toThrow(NotFoundException);
      expect(personRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('returns the mapped Person when found', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue(personRow);

      const result = await service.getById('person-1');
      expect(result.id).toBe('person-1');
    });

    it('throws NotFoundException when the Person does not exist', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('transitionLifecycleStage', () => {
    it('applies a valid transition', async () => {
      const { service, personRepository, eventPublisher } = buildService();
      personRepository.findById.mockResolvedValue({ ...personRow, lifecycleStage: 'VISITOR' });
      personRepository.updateLifecycleStage.mockResolvedValue({ ...personRow, lifecycleStage: 'FIRST_TIME_GUEST' });

      const result = await service.transitionLifecycleStage('person-1', { toStage: 'FIRST_TIME_GUEST' });

      expect(personRepository.updateLifecycleStage).toHaveBeenCalledWith('person-1', 'FIRST_TIME_GUEST');
      expect(result.lifecycleStage).toBe('FIRST_TIME_GUEST');
      expect(eventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'lifecycle_stage.transitioned',
          branchId: 'branch-1',
          subjectPersonId: 'person-1',
          payload: { fromStage: 'VISITOR', toStage: 'FIRST_TIME_GUEST' },
        }),
      );
    });

    it('rejects an invalid transition (FR-PPL-03)', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue({ ...personRow, lifecycleStage: 'VISITOR' });

      await expect(service.transitionLifecycleStage('person-1', { toStage: 'MEMBER' })).rejects.toThrow(
        ConflictException,
      );
      expect(personRepository.updateLifecycleStage).not.toHaveBeenCalled();
    });

    it('redirects FollowUp -> AssignedToBacenta to the group-membership endpoint (PRD §19.1 step 6)', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue({ ...personRow, lifecycleStage: 'FOLLOW_UP' });

      await expect(
        service.transitionLifecycleStage('person-1', { toStage: 'ASSIGNED_TO_BACENTA' }),
      ).rejects.toThrow(/group-memberships/);
      expect(personRepository.updateLifecycleStage).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for a missing Person', async () => {
      const { service, personRepository } = buildService();
      personRepository.findById.mockResolvedValue(null);

      await expect(service.transitionLifecycleStage('missing', { toStage: 'MEMBER' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('list', () => {
    it('searches the whole Branch when no groupId is given', async () => {
      const { service, personRepository, groupRosterService } = buildService();
      personRepository.findByBranch.mockResolvedValue([personRow]);

      const result = await service.list(actor, {});

      expect(personRepository.findByBranch).toHaveBeenCalledWith('branch-1', undefined);
      expect(groupRosterService.listActiveMembers).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('person-1');
    });

    it('passes the search term through to findByBranch', async () => {
      const { service, personRepository } = buildService();

      await service.list(actor, { search: 'Owusu' });

      expect(personRepository.findByBranch).toHaveBeenCalledWith('branch-1', 'Owusu');
    });

    it('resolves a group-scoped roster via GroupRosterService when groupId is given', async () => {
      const { service, personRepository, groupRosterService } = buildService();
      groupRosterService.listActiveMembers.mockResolvedValue([
        { personId: 'person-1', startedAt: new Date() },
        { personId: 'person-2', startedAt: new Date() },
      ]);
      personRepository.findByIds.mockResolvedValue([personRow]);

      await service.list(actor, { groupId: 'bacenta-1', search: 'Ama' });

      expect(groupRosterService.listActiveMembers).toHaveBeenCalledWith('bacenta-1');
      expect(personRepository.findByIds).toHaveBeenCalledWith(['person-1', 'person-2'], 'Ama');
      expect(personRepository.findByBranch).not.toHaveBeenCalled();
    });
  });

  describe('countByBranch', () => {
    it('delegates directly to personRepository.countByBranch', async () => {
      const { service, personRepository } = buildService();
      personRepository.countByBranch.mockResolvedValue(482);

      const result = await service.countByBranch('branch-1');

      expect(personRepository.countByBranch).toHaveBeenCalledWith('branch-1');
      expect(result).toBe(482);
    });
  });

  describe('countByBranchCreatedBefore', () => {
    it('delegates directly to personRepository.countByBranchCreatedBefore', async () => {
      const { service, personRepository } = buildService();
      const cutoff = new Date('2026-08-01T00:00:00.000Z');
      personRepository.countByBranchCreatedBefore.mockResolvedValue(470);

      const result = await service.countByBranchCreatedBefore('branch-1', cutoff);

      expect(personRepository.countByBranchCreatedBefore).toHaveBeenCalledWith('branch-1', cutoff);
      expect(result).toBe(470);
    });
  });
});
