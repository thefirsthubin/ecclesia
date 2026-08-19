import { PotentialRepository } from './potential.repository';

describe('[Milestone C.1.1] PotentialRepository', () => {
  function buildRepository() {
    const prisma = {
      potential: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    };
    const repository = new PotentialRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.potential.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.potential.create.mockResolvedValue({ id: 'potential-1' });

    const result = await repository.create({
      branchId: 'branch-1',
      groupId: 'bacenta-1',
      firstName: 'Kwabena',
      source: 'REFERRAL',
      createdByPersonId: 'leader-1',
    });

    expect(prisma.potential.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        groupId: 'bacenta-1',
        personId: undefined,
        firstName: 'Kwabena',
        lastName: undefined,
        phone: undefined,
        source: 'REFERRAL',
        notes: undefined,
        assignedToPersonId: undefined,
        createdByPersonId: 'leader-1',
      },
    });
    expect(result).toEqual({ id: 'potential-1' });
  });

  it('findById() delegates directly to prisma.potential.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.potential.findUnique.mockResolvedValue({ id: 'potential-1' });

    const result = await repository.findById('potential-1');

    expect(prisma.potential.findUnique).toHaveBeenCalledWith({ where: { id: 'potential-1' } });
    expect(result).toEqual({ id: 'potential-1' });
  });

  it('update() delegates directly to prisma.potential.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.potential.update.mockResolvedValue({ id: 'potential-1', status: 'IN_PROGRESS' });

    const result = await repository.update('potential-1', { status: 'IN_PROGRESS' });

    expect(prisma.potential.update).toHaveBeenCalledWith({ where: { id: 'potential-1' }, data: { status: 'IN_PROGRESS' } });
    expect(result).toEqual({ id: 'potential-1', status: 'IN_PROGRESS' });
  });

  describe('listByGroup', () => {
    it('filters by groupId, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.potential.findMany.mockResolvedValue([{ id: 'potential-1' }]);

      const result = await repository.listByGroup('bacenta-1');

      expect(prisma.potential.findMany).toHaveBeenCalledWith({ where: { groupId: 'bacenta-1' }, orderBy: { createdAt: 'desc' } });
      expect(result).toEqual([{ id: 'potential-1' }]);
    });
  });

  describe('listByGroups', () => {
    it('filters by groupId IN the given set', async () => {
      const { repository, prisma } = buildRepository();
      prisma.potential.findMany.mockResolvedValue([{ id: 'potential-1' }]);

      const result = await repository.listByGroups(['bacenta-1', 'bacenta-2']);

      expect(prisma.potential.findMany).toHaveBeenCalledWith({
        where: { groupId: { in: ['bacenta-1', 'bacenta-2'] } },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{ id: 'potential-1' }]);
    });

    it('returns an empty array without querying when given an empty group set', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listByGroups([]);

      expect(prisma.potential.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('listByBranch', () => {
    it('filters by branchId, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.potential.findMany.mockResolvedValue([{ id: 'potential-1' }]);

      const result = await repository.listByBranch('branch-1');

      expect(prisma.potential.findMany).toHaveBeenCalledWith({ where: { branchId: 'branch-1' }, orderBy: { createdAt: 'desc' } });
      expect(result).toEqual([{ id: 'potential-1' }]);
    });
  });
});
