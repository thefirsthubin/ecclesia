import { CounsellingSessionRepository } from './counselling-session.repository';

describe('[Milestone B] CounsellingSessionRepository', () => {
  function buildRepository() {
    const prisma = {
      counsellingSession: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    };
    const repository = new CounsellingSessionRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.counsellingSession.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.counsellingSession.create.mockResolvedValue({ id: 'session-1' });
    const scheduledAt = new Date('2026-08-20T10:00:00.000Z');

    const result = await repository.create({
      branchId: 'branch-1',
      personId: 'person-1',
      counsellorPersonId: 'pastor-1',
      scheduledAt,
    });

    expect(prisma.counsellingSession.create).toHaveBeenCalledWith({
      data: {
        branchId: 'branch-1',
        personId: 'person-1',
        counsellorPersonId: 'pastor-1',
        scheduledAt,
        briefNote: undefined,
      },
    });
    expect(result).toEqual({ id: 'session-1' });
  });

  it('findById() delegates directly to prisma.counsellingSession.findUnique', async () => {
    const { repository, prisma } = buildRepository();
    prisma.counsellingSession.findUnique.mockResolvedValue({ id: 'session-1' });

    const result = await repository.findById('session-1');

    expect(prisma.counsellingSession.findUnique).toHaveBeenCalledWith({ where: { id: 'session-1' } });
    expect(result).toEqual({ id: 'session-1' });
  });

  it('listByPerson() filters by personId only - organizational scope, not author-filtered', async () => {
    const { repository, prisma } = buildRepository();
    prisma.counsellingSession.findMany.mockResolvedValue([{ id: 'session-1' }]);

    const result = await repository.listByPerson('person-1');

    expect(prisma.counsellingSession.findMany).toHaveBeenCalledWith({
      where: { personId: 'person-1' },
      orderBy: { scheduledAt: 'desc' },
    });
    expect(result).toEqual([{ id: 'session-1' }]);
  });

  it('updateStatus() delegates directly to prisma.counsellingSession.update', async () => {
    const { repository, prisma } = buildRepository();
    prisma.counsellingSession.update.mockResolvedValue({ id: 'session-1', status: 'COMPLETED' });

    const result = await repository.updateStatus('session-1', 'COMPLETED');

    expect(prisma.counsellingSession.update).toHaveBeenCalledWith({ where: { id: 'session-1' }, data: { status: 'COMPLETED' } });
    expect(result).toEqual({ id: 'session-1', status: 'COMPLETED' });
  });

  describe('[Milestone B, Slice 7] listScheduledInRange', () => {
    it('filters by branchId, excludes CANCELLED, and a scheduledAt window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.counsellingSession.findMany.mockResolvedValue([{ id: 'session-1' }]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await repository.listScheduledInRange('branch-1', from, to);

      expect(prisma.counsellingSession.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: { not: 'CANCELLED' }, scheduledAt: { gte: from, lte: to } },
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual([{ id: 'session-1' }]);
    });
  });

  describe('[Milestone C] listScheduledInRangeForPersons', () => {
    it('filters by personId IN the given set, excludes CANCELLED, and a scheduledAt window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.counsellingSession.findMany.mockResolvedValue([{ id: 'session-1' }]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T00:00:00.000Z');

      const result = await repository.listScheduledInRangeForPersons(['person-1', 'person-2'], from, to);

      expect(prisma.counsellingSession.findMany).toHaveBeenCalledWith({
        where: { personId: { in: ['person-1', 'person-2'] }, status: { not: 'CANCELLED' }, scheduledAt: { gte: from, lte: to } },
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual([{ id: 'session-1' }]);
    });

    it('returns an empty array without querying when given an empty person set', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listScheduledInRangeForPersons([], new Date(), new Date());

      expect(prisma.counsellingSession.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
