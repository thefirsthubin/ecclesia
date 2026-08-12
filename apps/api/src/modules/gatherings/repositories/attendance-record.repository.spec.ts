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
});
