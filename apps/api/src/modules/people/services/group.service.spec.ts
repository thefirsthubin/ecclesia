import { NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { GroupService } from './group.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildGroup(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'PASTORAL_CARE',
    name: 'Grace Bacenta',
    meetingSchedule: null,
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('GroupService', () => {
  const actor: ActorContext = { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' };

  function buildService() {
    const groupRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findByBranch: jest.fn(),
      findActiveBacentasByBranch: jest.fn(),
    };
    const service = new GroupService(groupRepository as never);
    return { service, groupRepository };
  }

  it('create() scopes the new Group to the actor’s own Branch', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.create.mockResolvedValue(buildGroup());

    const result = await service.create(actor, { type: 'PASTORAL_CARE', name: 'Grace Bacenta' });

    expect(groupRepository.create).toHaveBeenCalledWith({
      branchId: 'branch-1',
      type: 'PASTORAL_CARE',
      name: 'Grace Bacenta',
      meetingSchedule: undefined,
      meetingLocation: undefined,
      category: undefined,
    });
    expect(result).toMatchObject({ id: 'group-1', branchId: 'branch-1', type: 'PASTORAL_CARE' });
  });

  describe('list (Ministry Web Admin sprint - GET /groups)', () => {
    it('delegates to findByBranch with the actor\'s own Branch and the given type filter', async () => {
      const { service, groupRepository } = buildService();
      groupRepository.findByBranch.mockResolvedValue([buildGroup({ type: 'MINISTRY' })]);

      const result = await service.list(actor, { type: 'MINISTRY' });

      expect(groupRepository.findByBranch).toHaveBeenCalledWith('branch-1', 'MINISTRY');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('MINISTRY');
    });

    it('passes undefined through when no type filter is given', async () => {
      const { service, groupRepository } = buildService();
      groupRepository.findByBranch.mockResolvedValue([]);

      await service.list(actor, {});

      expect(groupRepository.findByBranch).toHaveBeenCalledWith('branch-1', undefined);
    });
  });

  it('getById() throws NotFoundException when the Group does not exist', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue(null);

    await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
  });

  it('update() throws NotFoundException when the Group does not exist', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue(null);

    await expect(service.update('missing', { name: 'New Name' })).rejects.toThrow(NotFoundException);
  });

  it('update() applies the given fields and returns the mapped DTO', async () => {
    const { service, groupRepository } = buildService();
    groupRepository.findById.mockResolvedValue(buildGroup());
    groupRepository.update.mockResolvedValue(buildGroup({ name: 'Renamed Bacenta' }));

    const result = await service.update('group-1', { name: 'Renamed Bacenta' });

    expect(groupRepository.update).toHaveBeenCalledWith('group-1', {
      name: 'Renamed Bacenta',
      meetingSchedule: undefined,
      meetingLocation: undefined,
      category: undefined,
      lifecycleStatus: undefined,
    });
    expect(result.name).toBe('Renamed Bacenta');
  });

  describe('listActiveBacentasForBranch (Resident Pastor Dashboard - Bacenta Leaderboard milestone)', () => {
    it('maps every Group the repository returns to a response DTO', async () => {
      const { service, groupRepository } = buildService();
      groupRepository.findActiveBacentasByBranch.mockResolvedValue([buildGroup(), buildGroup({ id: 'group-2', name: 'Faith Bacenta' })]);

      const result = await service.listActiveBacentasForBranch('branch-1');

      expect(groupRepository.findActiveBacentasByBranch).toHaveBeenCalledWith('branch-1');
      expect(result).toHaveLength(2);
      expect(result[1].name).toBe('Faith Bacenta');
    });

    it('returns an empty array, not an error, when the branch has no active Bacentas', async () => {
      const { service, groupRepository } = buildService();
      groupRepository.findActiveBacentasByBranch.mockResolvedValue([]);

      const result = await service.listActiveBacentasForBranch('branch-1');

      expect(result).toEqual([]);
    });
  });
});
