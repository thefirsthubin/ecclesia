import { OutreachRepository } from './outreach.repository';

describe('[Milestone B] OutreachRepository', () => {
  function buildRepository() {
    const prisma = {
      outreach: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    };
    const repository = new OutreachRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.outreach.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreach.create.mockResolvedValue({ id: 'outreach-1' });
    const occurredAt = new Date('2026-08-15T09:00:00.000Z');

    const result = await repository.create({
      branchId: 'branch-1',
      leaderPersonId: 'leader-1',
      createdByPersonId: 'leader-1',
      occurredAt,
    });

    expect(prisma.outreach.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        groupId: undefined,
        occurredAt,
        location: undefined,
        leaderPersonId: 'leader-1',
        notes: undefined,
        createdByPersonId: 'leader-1',
      },
    });
    expect(result).toEqual({ id: 'outreach-1' });
  });

  it('findById() delegates directly to prisma.outreach.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.outreach.findUnique.mockResolvedValue({ id: 'outreach-1' });

    const result = await repository.findById('outreach-1');

    expect(prisma.outreach.findUnique).toHaveBeenCalledWith({ where: { id: 'outreach-1' } });
    expect(result).toEqual({ id: 'outreach-1' });
  });

  describe('listByGroup', () => {
    it('filters by groupId, newest first, with no date filter when from/to are omitted', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreach.findMany.mockResolvedValue([]);

      await repository.listByGroup('bacenta-1');

      expect(prisma.outreach.findMany).toHaveBeenCalledWith({
        where: { groupId: 'bacenta-1' },
        orderBy: { occurredAt: 'desc' },
      });
    });

    it('adds an occurredAt range filter when from/to are given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreach.findMany.mockResolvedValue([]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      await repository.listByGroup('bacenta-1', from, to);

      expect(prisma.outreach.findMany).toHaveBeenCalledWith({
        where: { groupId: 'bacenta-1', occurredAt: { gte: from, lte: to } },
        orderBy: { occurredAt: 'desc' },
      });
    });
  });

  describe('listByBranch', () => {
    it('filters by branchId, newest first', async () => {
      const { repository, prisma } = buildRepository();
      prisma.outreach.findMany.mockResolvedValue([]);

      await repository.listByBranch('branch-1');

      expect(prisma.outreach.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1' },
        orderBy: { occurredAt: 'desc' },
      });
    });
  });
});
