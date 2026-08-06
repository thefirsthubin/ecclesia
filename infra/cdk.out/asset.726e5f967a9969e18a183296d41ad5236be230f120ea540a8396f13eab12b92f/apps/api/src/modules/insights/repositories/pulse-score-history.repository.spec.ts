import { PulseScoreHistoryRepository } from './pulse-score-history.repository';

describe('PulseScoreHistoryRepository', () => {
  function buildRepository() {
    const prisma = {
      pulseScoreHistory: { create: jest.fn(), findMany: jest.fn() },
    };
    const repository = new PulseScoreHistoryRepository(prisma as never);
    return { repository, prisma };
  }

  it('append() maps input onto prisma.pulseScoreHistory.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pulseScoreHistory.create.mockResolvedValue({ id: 'hist-1' });
    const input = {
      branchId: 'branch-1',
      scopeType: 'BRANCH' as const,
      scopeId: 'branch-1',
      score: 60,
      computedAt: new Date('2026-08-01T00:00:00.000Z'),
    };

    const result = await repository.append(input);

    expect(prisma.pulseScoreHistory.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'hist-1' });
  });

  it('findRecentByScope() filters by scope and a trailing "since" bound, ordered ascending', async () => {
    const { repository, prisma } = buildRepository();
    prisma.pulseScoreHistory.findMany.mockResolvedValue([]);
    const since = new Date('2026-07-11T00:00:00.000Z');

    await repository.findRecentByScope('GROUP', 'group-1', since);

    expect(prisma.pulseScoreHistory.findMany).toHaveBeenCalledWith({
      where: { scopeType: 'GROUP', scopeId: 'group-1', computedAt: { gte: since } },
      orderBy: { computedAt: 'asc' },
    });
  });
});
