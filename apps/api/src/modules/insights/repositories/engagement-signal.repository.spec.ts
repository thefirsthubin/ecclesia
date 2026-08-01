import { EngagementSignalRepository } from './engagement-signal.repository';

describe('EngagementSignalRepository', () => {
  function buildRepository() {
    const prisma = {
      engagementSignal: { create: jest.fn(), groupBy: jest.fn() },
    };
    const repository = new EngagementSignalRepository(prisma as never);
    return { repository, prisma };
  }

  it('create() maps input onto prisma.engagementSignal.create', async () => {
    const { repository, prisma } = buildRepository();
    prisma.engagementSignal.create.mockResolvedValue({ id: 'signal-1' });
    const input = {
      branchId: 'branch-1',
      personId: 'person-1',
      signalType: 'ATTENDANCE',
      payload: {},
      occurredAt: new Date('2026-08-01T00:00:00.000Z'),
    };

    const result = await repository.create(input);

    expect(prisma.engagementSignal.create).toHaveBeenCalledWith({ data: input });
    expect(result).toEqual({ id: 'signal-1' });
  });

  it('countByTypeInWindow() groups by signalType, scoped to a Branch when groupId is omitted', async () => {
    const { repository, prisma } = buildRepository();
    prisma.engagementSignal.groupBy.mockResolvedValue([{ signalType: 'ATTENDANCE', _count: { _all: 4 } }]);
    const windowStart = new Date('2026-07-04T00:00:00.000Z');
    const now = new Date('2026-08-01T00:00:00.000Z');

    const result = await repository.countByTypeInWindow('branch-1', undefined, windowStart, now);

    expect(prisma.engagementSignal.groupBy).toHaveBeenCalledWith({
      by: ['signalType'],
      where: { branchId: 'branch-1', occurredAt: { gte: windowStart, lte: now } },
      _count: { _all: true },
    });
    expect(result).toEqual([{ signalType: 'ATTENDANCE', count: 4 }]);
  });

  it('countByTypeInWindow() adds a groupId filter when scoping to one Group', async () => {
    const { repository, prisma } = buildRepository();
    prisma.engagementSignal.groupBy.mockResolvedValue([]);
    const windowStart = new Date('2026-07-04T00:00:00.000Z');
    const now = new Date('2026-08-01T00:00:00.000Z');

    await repository.countByTypeInWindow('branch-1', 'group-1', windowStart, now);

    expect(prisma.engagementSignal.groupBy).toHaveBeenCalledWith({
      by: ['signalType'],
      where: { branchId: 'branch-1', groupId: 'group-1', occurredAt: { gte: windowStart, lte: now } },
      _count: { _all: true },
    });
  });
});
