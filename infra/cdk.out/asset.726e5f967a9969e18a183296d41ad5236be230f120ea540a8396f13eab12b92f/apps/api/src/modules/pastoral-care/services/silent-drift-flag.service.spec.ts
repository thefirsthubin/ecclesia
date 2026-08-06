import { SilentDriftFlagService } from './silent-drift-flag.service';

const NOW = new Date('2026-08-01T00:00:00.000Z');

function buildFlag(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sdf-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: 'person-1',
    attendanceMissedCount: 0,
    attendanceThreshold: 3,
    bacentaMissedCount: 3,
    bacentaThreshold: 3,
    status: 'FLAGGED',
    assignedShepherdPersonId: 'shepherd-1',
    resolvedAt: null,
    escalatedAt: null,
    createdAt: NOW,
    ...overrides,
  };
}

describe('SilentDriftFlagService', () => {
  function buildService() {
    const silentDriftFlagRepository = { listByGroup: jest.fn() };
    const service = new SilentDriftFlagService(silentDriftFlagRepository as never);
    return { service, silentDriftFlagRepository };
  }

  describe('listForGroup', () => {
    it('maps repository rows to response DTOs, preserving the specific drift pattern (US-G3)', async () => {
      const { service, silentDriftFlagRepository } = buildService();
      silentDriftFlagRepository.listByGroup.mockResolvedValue([buildFlag()]);

      const result = await service.listForGroup('bacenta-1');

      expect(silentDriftFlagRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', undefined);
      expect(result).toEqual([
        {
          id: 'sdf-1',
          branchId: 'branch-1',
          groupId: 'bacenta-1',
          personId: 'person-1',
          attendanceMissedCount: 0,
          attendanceThreshold: 3,
          bacentaMissedCount: 3,
          bacentaThreshold: 3,
          status: 'FLAGGED',
          assignedShepherdPersonId: 'shepherd-1',
          resolvedAt: null,
          escalatedAt: null,
          createdAt: NOW.toISOString(),
        },
      ]);
    });

    it('passes an explicit status filter through to the repository', async () => {
      const { service, silentDriftFlagRepository } = buildService();
      silentDriftFlagRepository.listByGroup.mockResolvedValue([]);

      await service.listForGroup('bacenta-1', ['RESOLVED']);

      expect(silentDriftFlagRepository.listByGroup).toHaveBeenCalledWith('bacenta-1', ['RESOLVED']);
    });
  });
});
