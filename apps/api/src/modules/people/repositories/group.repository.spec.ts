import { GroupRepository } from './group.repository';

describe('GroupRepository', () => {
  function buildRepository() {
    const prisma = {
      group: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };
    const repository = new GroupRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() delegates directly to prisma.group.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.create.mockResolvedValue({ id: 'group-1' });
    const input = { branchId: 'branch-1', type: 'PASTORAL_CARE' as const, name: 'Grace Bacenta' };

    const result = await repository.create(input);

    expect(prisma.group.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'group-1' });
  });

  it('findById() delegates directly to prisma.group.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.findUnique.mockResolvedValue({ id: 'group-1' });

    const result = await repository.findById('group-1');

    expect(prisma.group.findUnique).toHaveBeenCalledWith({ where: { id: 'group-1' } });
    expect(result).toEqual({ id: 'group-1' });
  });

  it('update() delegates directly to prisma.group.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.group.update.mockResolvedValue({ id: 'group-1', name: 'Renamed Bacenta' });
    const input = { name: 'Renamed Bacenta' };

    const result = await repository.update('group-1', input);

    expect(prisma.group.update).toHaveBeenCalledWith({ where: { id: 'group-1' }, data: input });
    expect(result).toEqual({ id: 'group-1', name: 'Renamed Bacenta' });
  });

  describe('findByBranch (Ministry Web Admin sprint)', () => {
    it('lists every Group in the Branch, ordered by name, when no type is given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.group.findMany.mockResolvedValue([{ id: 'group-1' }]);

      const result = await repository.findByBranch('branch-1');

      expect(prisma.group.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([{ id: 'group-1' }]);
    });

    it('narrows to the given type when supplied', async () => {
      const { repository, prisma } = buildRepository();
      prisma.group.findMany.mockResolvedValue([]);

      await repository.findByBranch('branch-1', 'MINISTRY');

      expect(prisma.group.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', type: 'MINISTRY' },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('findActiveBacentasByBranch (Resident Pastor Dashboard - Bacenta Leaderboard milestone)', () => {
    it('filters to PASTORAL_CARE type, ACTIVE lifecycle status, scoped to the branch', async () => {
      const { repository, prisma } = buildRepository();
      prisma.group.findMany.mockResolvedValue([{ id: 'bacenta-1', name: 'Bacenta 1' }]);

      const result = await repository.findActiveBacentasByBranch('branch-1');

      expect(prisma.group.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', type: 'PASTORAL_CARE', lifecycleStatus: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual([{ id: 'bacenta-1', name: 'Bacenta 1' }]);
    });

    it('never leaks another branch\'s Bacentas - a different branchId produces a different where clause', async () => {
      const { repository, prisma } = buildRepository();
      prisma.group.findMany.mockResolvedValue([]);

      await repository.findActiveBacentasByBranch('branch-2');

      expect(prisma.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ branchId: 'branch-2' }) }),
      );
    });
  });
});
