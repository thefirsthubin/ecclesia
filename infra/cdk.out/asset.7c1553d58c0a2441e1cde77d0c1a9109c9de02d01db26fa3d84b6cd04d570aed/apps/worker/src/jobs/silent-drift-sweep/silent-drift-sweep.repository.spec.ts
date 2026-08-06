import { DEFAULT_SILENT_DRIFT_THRESHOLDS, SilentDriftSweepRepository } from './silent-drift-sweep.repository';

describe('SilentDriftSweepRepository', () => {
  function buildRepository() {
    const prisma = {
      configuration: { findUnique: jest.fn() },
      attendanceRecord: { count: jest.fn() },
    };
    const repository = new SilentDriftSweepRepository(prisma as never);
    return { repository, prisma };
  }

  describe('getThresholds()', () => {
    it('returns the configured n/m when present and valid', async () => {
      const { repository, prisma } = buildRepository();
      prisma.configuration.findUnique.mockResolvedValue({ silentDriftConfig: { n: 4, m: 2 } });

      const result = await repository.getThresholds('branch-1');

      expect(result).toEqual({ n: 4, m: 2 });
    });

    it('falls back to DEFAULT_SILENT_DRIFT_THRESHOLDS when no Configuration row exists', async () => {
      const { repository, prisma } = buildRepository();
      prisma.configuration.findUnique.mockResolvedValue(null);

      const result = await repository.getThresholds('branch-1');

      expect(result).toEqual(DEFAULT_SILENT_DRIFT_THRESHOLDS);
    });

    it('falls back to defaults when silent_drift_config has the wrong shape', async () => {
      const { repository, prisma } = buildRepository();
      prisma.configuration.findUnique.mockResolvedValue({ silentDriftConfig: { n: 'not-a-number' } });

      const result = await repository.getThresholds('branch-1');

      expect(result).toEqual(DEFAULT_SILENT_DRIFT_THRESHOLDS);
    });
  });

  describe('countPresentAttendance()', () => {
    it('returns 0 without querying when gatheringIds is empty', async () => {
      const { repository, prisma } = buildRepository();

      const result = await repository.countPresentAttendance('person-1', []);

      expect(result).toBe(0);
      expect(prisma.attendanceRecord.count).not.toHaveBeenCalled();
    });

    it('counts only PRESENT attendance among the given gatheringIds', async () => {
      const { repository, prisma } = buildRepository();
      prisma.attendanceRecord.count.mockResolvedValue(2);

      const result = await repository.countPresentAttendance('person-1', ['g-1', 'g-2']);

      expect(result).toBe(2);
      expect(prisma.attendanceRecord.count).toHaveBeenCalledWith({
        where: { personId: 'person-1', gatheringId: { in: ['g-1', 'g-2'] }, status: 'PRESENT' },
      });
    });
  });
});
