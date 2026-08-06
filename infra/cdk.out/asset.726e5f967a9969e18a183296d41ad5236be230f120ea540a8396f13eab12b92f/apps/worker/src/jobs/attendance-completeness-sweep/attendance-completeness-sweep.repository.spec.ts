import { AttendanceCompletenessSweepRepository } from './attendance-completeness-sweep.repository';

describe('AttendanceCompletenessSweepRepository', () => {
  it('listRecentlyEndedGatherings() excludes CANCELLED and bounds by the lookback window', async () => {
    const prisma = { gathering: { findMany: jest.fn().mockResolvedValue([]) } };
    const repository = new AttendanceCompletenessSweepRepository(prisma as never);
    const now = new Date('2026-08-01T00:00:00.000Z');

    await repository.listRecentlyEndedGatherings('branch-1', now, 14);

    expect(prisma.gathering.findMany).toHaveBeenCalledWith({
      where: {
        branchId: 'branch-1',
        status: { not: 'CANCELLED' },
        scheduledEnd: { not: null, lte: now, gte: new Date('2026-07-18T00:00:00.000Z') },
      },
    });
  });

  it('hasAttendanceRecorded() returns true when at least one record exists', async () => {
    const prisma = { attendanceRecord: { count: jest.fn().mockResolvedValue(1) } };
    const repository = new AttendanceCompletenessSweepRepository(prisma as never);

    const result = await repository.hasAttendanceRecorded('gathering-1');

    expect(result).toBe(true);
    expect(prisma.attendanceRecord.count).toHaveBeenCalledWith({ where: { gatheringId: 'gathering-1' } });
  });
});
