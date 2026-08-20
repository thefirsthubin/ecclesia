import { StaffingTargetRepository } from './staffing-target.repository';

describe('StaffingTargetRepository', () => {
  function buildRepository() {
    const prisma = {
      staffingTarget: { upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    };
    const repository = new StaffingTargetRepository(prisma as never);
    return { repository, prisma };
  }

  it('upsert() keys on the (gatheringId, groupId) compound unique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.staffingTarget.upsert.mockResolvedValue({ id: 'target-1' });
    const input = {
      branchId: 'branch-1',
      gatheringId: 'gathering-1',
      groupId: 'basonta-1',
      targetCount: 8,
      createdByPersonId: 'leader-1',
    };

    const result = await repository.upsert(input);

    expect(prisma.staffingTarget.upsert).toHaveBeenCalledWith({
      where: { gatheringId_groupId: { gatheringId: 'gathering-1', groupId: 'basonta-1' } },
      create: input,
      update: { targetCount: 8 },
    });
    expect(result).toEqual({ id: 'target-1' });
  });

  it('findById() delegates directly to prisma.staffingTarget.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.staffingTarget.findUnique.mockResolvedValue({ id: 'target-1' });

    const result = await repository.findById('target-1');

    expect(prisma.staffingTarget.findUnique).toHaveBeenCalledWith({ where: { id: 'target-1' } });
    expect(result).toEqual({ id: 'target-1' });
  });

  it('findByGroupId() lists every Staffing Target for a Basonta, ordered by gatheringId', async () => {
    const { repository, prisma } = buildRepository();
    prisma.staffingTarget.findMany.mockResolvedValue([{ id: 'target-1' }, { id: 'target-2' }]);

    const result = await repository.findByGroupId('basonta-1');

    expect(prisma.staffingTarget.findMany).toHaveBeenCalledWith({ where: { groupId: 'basonta-1' }, orderBy: { gatheringId: 'asc' } });
    expect(result).toEqual([{ id: 'target-1' }, { id: 'target-2' }]);
  });

  /** `[Post-Milestone D — Portal Experiences follow-up]` */
  describe('[Post-Milestone D] listByGroupWithCreatedInRange', () => {
    it('lists Staffing Targets for a Basonta whose createdAt falls within the window, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.staffingTarget.findMany.mockResolvedValue([{ id: 'target-1' }]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await repository.listByGroupWithCreatedInRange('basonta-1', from, to);

      expect(prisma.staffingTarget.findMany).toHaveBeenCalledWith({
        where: { groupId: 'basonta-1', createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'target-1' }]);
    });
  });
});
