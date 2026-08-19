import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { PotentialService } from './potential.service';

const NOW = new Date('2026-08-19T00:00:00.000Z');

function buildPotential(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'potential-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: null,
    firstName: 'Kwabena',
    lastName: null,
    phone: null,
    source: 'REFERRAL',
    status: 'NEW',
    notes: null,
    assignedToPersonId: null,
    createdByPersonId: 'leader-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('[Milestone C.1.1] PotentialService', () => {
  function buildService() {
    const potentialRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      listByGroup: jest.fn(),
      listByGroups: jest.fn(),
      listByBranch: jest.fn(),
    };
    const service = new PotentialService(potentialRepository as never);
    return { service, potentialRepository };
  }

  const bacentaLeader: ActorContext = { personId: 'leader-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };

  describe('create', () => {
    it('creates with the actor\'s own Branch and Person as createdByPersonId', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.create.mockResolvedValue(buildPotential());

      const result = await service.create(bacentaLeader, {
        groupId: 'bacenta-1',
        firstName: 'Kwabena',
        source: 'REFERRAL',
      } as never);

      expect(potentialRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', createdByPersonId: 'leader-1', groupId: 'bacenta-1', firstName: 'Kwabena', source: 'REFERRAL' }),
      );
      expect(result.id).toBe('potential-1');
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Potential does not exist', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });

    it('maps a found Potential to a response DTO', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.findById.mockResolvedValue(buildPotential());

      const result = await service.getById('potential-1');

      expect(result).toEqual(
        expect.objectContaining({ id: 'potential-1', groupId: 'bacenta-1', firstName: 'Kwabena', source: 'REFERRAL', status: 'NEW' }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the Potential does not exist', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.findById.mockResolvedValue(null);

      await expect(service.update('missing', { status: 'CONVERTED' } as never)).rejects.toThrow(NotFoundException);
    });

    it('delegates to the repository with status/notes/assignedToPersonId/personId', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.findById.mockResolvedValue(buildPotential());
      potentialRepository.update.mockResolvedValue(buildPotential({ status: 'CONVERTED', personId: 'person-1' }));

      const result = await service.update('potential-1', { status: 'CONVERTED', personId: 'person-1' } as never);

      expect(potentialRepository.update).toHaveBeenCalledWith('potential-1', {
        status: 'CONVERTED',
        notes: undefined,
        assignedToPersonId: undefined,
        personId: 'person-1',
      });
      expect(result.status).toBe('CONVERTED');
    });
  });

  describe('list', () => {
    it('delegates to listByGroup when query.groupId is present', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.listByGroup.mockResolvedValue([buildPotential()]);

      const result = await service.list(bacentaLeader, { groupId: 'bacenta-1' } as never);

      expect(potentialRepository.listByGroup).toHaveBeenCalledWith('bacenta-1');
      expect(result).toHaveLength(1);
    });

    it('[Milestone C.1.1] narrows to the actor\'s own cluster via listByGroups for a CLUSTER-scoped actor when groupId is absent', async () => {
      const { service, potentialRepository } = buildService();
      const assistantPastor: ActorContext = { personId: 'ap-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds: ['bacenta-1', 'bacenta-2'] };
      potentialRepository.listByGroups.mockResolvedValue([buildPotential()]);

      await service.list(assistantPastor, {} as never);

      expect(potentialRepository.listByGroups).toHaveBeenCalledWith(['bacenta-1', 'bacenta-2']);
    });

    it('narrows to the actor\'s own single group for an OWN_GROUP-scoped actor when groupId is absent', async () => {
      const { service, potentialRepository } = buildService();
      potentialRepository.listByGroups.mockResolvedValue([buildPotential()]);

      await service.list(bacentaLeader, {} as never);

      expect(potentialRepository.listByGroups).toHaveBeenCalledWith(['bacenta-1']);
    });

    it('falls back to listByBranch for a BRANCH/COUNCIL-scoped actor with no own group (Resident Pastor)', async () => {
      const { service, potentialRepository } = buildService();
      const residentPastor: ActorContext = { personId: 'rp-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };
      potentialRepository.listByBranch.mockResolvedValue([buildPotential()]);

      await service.list(residentPastor, {} as never);

      expect(potentialRepository.listByBranch).toHaveBeenCalledWith('branch-1');
      expect(potentialRepository.listByGroups).not.toHaveBeenCalled();
    });
  });
});
