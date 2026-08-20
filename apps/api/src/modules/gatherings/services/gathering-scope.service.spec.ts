import { NotFoundException } from '@nestjs/common';

import { GatheringScopeService } from './gathering-scope.service';

describe('GatheringScopeService', () => {
  function buildService() {
    const gatheringRepository = { findById: jest.fn(), listByGroupAndRange: jest.fn() };
    const service = new GatheringScopeService(gatheringRepository as never);
    return { service, gatheringRepository };
  }

  it('throws NotFoundException when the Gathering does not exist', async () => {
    const { service, gatheringRepository } = buildService();
    gatheringRepository.findById.mockResolvedValue(null);

    await expect(service.loadScope('missing')).rejects.toThrow(NotFoundException);
  });

  it('resolves to { branchId, ownerGroupId } for an existing Gathering', async () => {
    const { service, gatheringRepository } = buildService();
    gatheringRepository.findById.mockResolvedValue({ id: 'gathering-1', branchId: 'branch-1', ownerGroupId: 'bacenta-1' });

    const result = await service.loadScope('gathering-1');

    expect(result).toEqual({ branchId: 'branch-1', ownerGroupId: 'bacenta-1' });
  });

  it('[Milestone A] resolves ownerGroupId to null for a Branch-wide Gathering (Sunday/Midweek Service)', async () => {
    const { service, gatheringRepository } = buildService();
    gatheringRepository.findById.mockResolvedValue({ id: 'gathering-1', branchId: 'branch-1', ownerGroupId: null });

    const result = await service.loadScope('gathering-1');

    expect(result).toEqual({ branchId: 'branch-1', ownerGroupId: null });
  });

  /** `[Post-Milestone D — Portal Experiences follow-up]` */
  describe('[Post-Milestone D] listGatheringsForGroup', () => {
    it('delegates directly to the repository', async () => {
      const { service, gatheringRepository } = buildService();
      gatheringRepository.listByGroupAndRange.mockResolvedValue([]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await service.listGatheringsForGroup('group-1', from, to);

      expect(gatheringRepository.listByGroupAndRange).toHaveBeenCalledWith('group-1', from, to);
      expect(result).toEqual([]);
    });
  });
});
