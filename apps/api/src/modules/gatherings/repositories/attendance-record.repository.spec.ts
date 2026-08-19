import { AttendanceRecordRepository } from './attendance-record.repository';

describe('AttendanceRecordRepository', () => {
  function buildRepository() {
    const prisma = {
      attendanceRecord: { upsert: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    };
    const repository = new AttendanceRecordRepository(prisma as never);
    return { repository, prisma };
  }

  it('upsert() keys on the gatheringId_personId compound unique and updates status/recordedBy on conflict', async () => {
    const { repository, prisma } = buildRepository();
    prisma.attendanceRecord.upsert.mockResolvedValue({ id: 'ar-1' });
    const input = {
      gatheringId: 'g-1',
      personId: 'person-1',
      branchId: 'branch-1',
      status: 'PRESENT' as const,
      recordedByPersonId: 'usher-1',
    };

    const result = await repository.upsert(input);

    expect(prisma.attendanceRecord.upsert).toHaveBeenCalledWith({
      where: { gatheringId_personId: { gatheringId: 'g-1', personId: 'person-1' } },
      create: input,
      update: {
        status: input.status,
        recordedByPersonId: input.recordedByPersonId,
        recordedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({ id: 'ar-1' });
  });

  it('findByGathering() delegates directly to prisma.attendanceRecord.findMany', async () => {
    const { repository, prisma } = buildRepository();
    prisma.attendanceRecord.findMany.mockResolvedValue([{ id: 'ar-1' }]);

    const result = await repository.findByGathering('g-1');

    expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({ where: { gatheringId: 'g-1' } });
    expect(result).toEqual([{ id: 'ar-1' }]);
  });

  it('countByGathering() delegates directly to prisma.attendanceRecord.count', async () => {
    const { repository, prisma } = buildRepository();
    prisma.attendanceRecord.count.mockResolvedValue(3);

    const result = await repository.countByGathering('g-1');

    expect(prisma.attendanceRecord.count).toHaveBeenCalledWith({ where: { gatheringId: 'g-1' } });
    expect(result).toBe(3);
  });

  describe('countPresentInWindow', () => {
    it('counts only PRESENT records, scoped to the branch and the [from, to) window', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.count.mockResolvedValue(356);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');

      const result = await repository.countPresentInWindow('branch-1', from, to);

      expect(prisma.attendanceRecord.count).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: 'PRESENT', recordedAt: { gte: from, lt: to } },
      });
      expect(result).toBe(356);
    });

    it('never leaks a count across branches - a different branchId produces a different where clause', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.count.mockResolvedValue(0);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');

      await repository.countPresentInWindow('branch-2', from, to);

      expect(prisma.attendanceRecord.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ branchId: 'branch-2' }) }),
      );
    });
  });

  describe('[Milestone C] listDistinctPresentPersonIds', () => {
    it('filters by branchId, PRESENT status, Gathering.type IN gatheringTypes, and Gathering.scheduledStart in range', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([{ personId: 'p1' }, { personId: 'p2' }]);
      const from = new Date('2026-06-23T00:00:00.000Z');
      const to = new Date('2026-08-18T00:00:00.000Z');

      const result = await repository.listDistinctPresentPersonIds('branch-1', from, to, ['Sunday Service']);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: {
          branchId: 'branch-1',
          status: 'PRESENT',
          gathering: { type: { in: ['Sunday Service'] }, scheduledStart: { gte: from, lt: to } },
        },
        distinct: ['personId'],
        select: { personId: true },
      });
      expect(result).toEqual(['p1', 'p2']);
    });

    it('returns an empty array without querying when gatheringTypes is empty', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.listDistinctPresentPersonIds('branch-1', new Date(), new Date(), []);

      expect(prisma.attendanceRecord.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('[Milestone C] listPresentForTrend', () => {
    it('filters by branchId, PRESENT status, and a recordedAt window with no type/group filter by default', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([]);
      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-09-01T00:00:00.000Z');

      await repository.listPresentForTrend('branch-1', from, to);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: { branchId: 'branch-1', status: 'PRESENT', recordedAt: { gte: from, lt: to } },
        select: {
          id: true,
          recordedAt: true,
          gatheringId: true,
          gathering: { select: { ownerGroupId: true, type: true } },
        },
      });
    });

    it('adds a Gathering.type IN filter when gatheringTypes is given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([]);

      await repository.listPresentForTrend('branch-1', new Date(), new Date(), ['Sunday Service']);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ gathering: { type: { in: ['Sunday Service'] } } }) }),
      );
    });

    it('adds an OR(Gathering.ownerGroupId IN, ...) filter when only ownerGroupIds is given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([]);

      await repository.listPresentForTrend('branch-1', new Date(), new Date(), undefined, ['bacenta-1']);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: [{ gathering: { ownerGroupId: { in: ['bacenta-1'] } } }] }),
        }),
      );
    });

    it('[C.1.4] adds an OR(personId IN, ...) filter when only personIds is given', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([]);

      await repository.listPresentForTrend('branch-1', new Date(), new Date(), undefined, undefined, ['person-1', 'person-2']);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: [{ personId: { in: ['person-1', 'person-2'] } }] }),
        }),
      );
    });

    it('[C.1.4] combines ownerGroupIds and personIds with OR, so a Branch-wide Gathering attended by an in-scope Person is counted too', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.findMany.mockResolvedValue([]);

      await repository.listPresentForTrend('branch-1', new Date(), new Date(), undefined, ['bacenta-1'], ['person-1']);

      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ gathering: { ownerGroupId: { in: ['bacenta-1'] } } }, { personId: { in: ['person-1'] } }],
          }),
        }),
      );
    });
  });
});
