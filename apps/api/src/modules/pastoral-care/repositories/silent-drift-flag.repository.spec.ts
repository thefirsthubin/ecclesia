import { SilentDriftFlagRepository } from './silent-drift-flag.repository';

describe('SilentDriftFlagRepository', () => {
  function buildRepository() {
    const prisma = { silentDriftFlag: { findMany: jest.fn() } };
    const repository = new SilentDriftFlagRepository(prisma as never);
    return { repository, prisma };
  }

  it('listByGroup() defaults to the two still-open statuses, sorted most-recently-flagged first', async () => {
    const { repository, prisma } = buildRepository();
    prisma.silentDriftFlag.findMany.mockResolvedValue([{ id: 'sdf-1' }]);

    const result = await repository.listByGroup('bacenta-1');

    expect(prisma.silentDriftFlag.findMany).toHaveBeenCalledWith({
      where: { groupId: 'bacenta-1', status: { in: ['FLAGGED', 'ESCALATED'] } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'sdf-1' }]);
  });

  it('honors an explicit status filter instead of the default', async () => {
    const { repository, prisma } = buildRepository();
    prisma.silentDriftFlag.findMany.mockResolvedValue([]);

    await repository.listByGroup('bacenta-1', ['RESOLVED']);

    expect(prisma.silentDriftFlag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { groupId: 'bacenta-1', status: { in: ['RESOLVED'] } } }),
    );
  });

  /** `[Silent-Drift Detection Branch-wide milestone]` */
  describe('listByBranch', () => {
    it('defaults to the two still-open statuses, sorted most-recently-flagged first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.silentDriftFlag.findMany.mockResolvedValue([{ id: 'sdf-1' }]);

      const result = await repository.listByBranch('branch-1');

      expect(prisma.silentDriftFlag.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: { in: ['FLAGGED', 'ESCALATED'] } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'sdf-1' }]);
    });

    it('honors an explicit status filter instead of the default', async () => {
      const { repository, prisma } = buildRepository();
      prisma.silentDriftFlag.findMany.mockResolvedValue([]);

      await repository.listByBranch('branch-1', ['RESOLVED']);

      expect(prisma.silentDriftFlag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-1', status: { in: ['RESOLVED'] } } }),
      );
    });
  });

  describe('[Milestone C] listByGroups', () => {
    it('filters by groupId IN the given set, defaulting to the two still-open statuses', async () => {
      const { repository, prisma } = buildRepository();
      prisma.silentDriftFlag.findMany.mockResolvedValue([{ id: 'sdf-1' }]);

      const result = await repository.listByGroups(['bacenta-1', 'bacenta-2']);

      expect(prisma.silentDriftFlag.findMany).toHaveBeenCalledWith({
        where: { groupId: { in: ['bacenta-1', 'bacenta-2'] }, status: { in: ['FLAGGED', 'ESCALATED'] } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'sdf-1' }]);
    });

    it('returns an empty array without querying when given an empty group set', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listByGroups([]);

      expect(prisma.silentDriftFlag.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
