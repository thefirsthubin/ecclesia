import { ConflictException, NotFoundException } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';

import { StaffingTargetService } from './staffing-target.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildTarget(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'target-1',
    branchId: 'branch-1',
    gatheringId: 'gathering-1',
    groupId: 'basonta-1',
    targetCount: 8,
    createdByPersonId: 'leader-1',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('StaffingTargetService', () => {
  const basontaLeader: ActorContext = { personId: 'leader-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' };

  function buildService() {
    const staffingTargetRepository = { upsert: jest.fn(), findById: jest.fn(), findByGroupId: jest.fn() };
    const gatheringScopeService = { loadScope: jest.fn() };
    const groupRosterService = { countActiveMembers: jest.fn() };
    const service = new StaffingTargetService(
      staffingTargetRepository as never,
      gatheringScopeService as never,
      groupRosterService as never,
    );
    return { service, staffingTargetRepository, gatheringScopeService, groupRosterService };
  }

  describe('create', () => {
    it('throws ConflictException when the Gathering belongs to a different Branch', async () => {
      const { service, gatheringScopeService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-2' });

      await expect(
        service.create(basontaLeader, { gatheringId: 'gathering-1', groupId: 'basonta-1', targetCount: 8 }),
      ).rejects.toThrow(ConflictException);
    });

    it('upserts with the actor as createdByPersonId and returns the live-computed adequacy', async () => {
      const { service, gatheringScopeService, staffingTargetRepository, groupRosterService } = buildService();
      gatheringScopeService.loadScope.mockResolvedValue({ branchId: 'branch-1' });
      staffingTargetRepository.upsert.mockResolvedValue(buildTarget());
      groupRosterService.countActiveMembers.mockResolvedValue(5);

      const result = await service.create(basontaLeader, { gatheringId: 'gathering-1', groupId: 'basonta-1', targetCount: 8 });

      expect(staffingTargetRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', createdByPersonId: 'leader-1', targetCount: 8 }),
      );
      expect(result).toMatchObject({ targetCount: 8, rosteredCount: 5, isAdequate: false });
    });
  });

  describe('getById', () => {
    it('throws NotFoundException when the Staffing Target does not exist', async () => {
      const { service, staffingTargetRepository } = buildService();
      staffingTargetRepository.findById.mockResolvedValue(null);

      await expect(service.getById('missing')).rejects.toThrow(NotFoundException);
    });

    it('embeds a live rosteredCount/isAdequate computed from the current roster size', async () => {
      const { service, staffingTargetRepository, groupRosterService } = buildService();
      staffingTargetRepository.findById.mockResolvedValue(buildTarget({ targetCount: 4 }));
      groupRosterService.countActiveMembers.mockResolvedValue(4);

      const result = await service.getById('target-1');

      expect(groupRosterService.countActiveMembers).toHaveBeenCalledWith('basonta-1');
      expect(result.isAdequate).toBe(true);
      expect(result.ratio).toBe(1);
    });
  });

  describe('listByGroup', () => {
    it('embeds a live-computed adequacy on every Staffing Target for the Basonta', async () => {
      const { service, staffingTargetRepository, groupRosterService } = buildService();
      staffingTargetRepository.findByGroupId.mockResolvedValue([
        buildTarget({ id: 'target-1', targetCount: 4 }),
        buildTarget({ id: 'target-2', targetCount: 10 }),
      ]);
      groupRosterService.countActiveMembers.mockResolvedValue(5);

      const result = await service.listByGroup('basonta-1');

      expect(staffingTargetRepository.findByGroupId).toHaveBeenCalledWith('basonta-1');
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 'target-1', isAdequate: true });
      expect(result[1]).toMatchObject({ id: 'target-2', isAdequate: false });
    });
  });
});
