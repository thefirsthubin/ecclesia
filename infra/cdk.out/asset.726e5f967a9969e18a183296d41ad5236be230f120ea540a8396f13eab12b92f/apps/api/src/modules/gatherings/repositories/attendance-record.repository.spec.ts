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
});
