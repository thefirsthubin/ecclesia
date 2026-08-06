import { PulseScoreService } from './pulse-score.service';

function pulseScoreRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'score-1',
    branchId: 'branch-1',
    scopeType: 'BRANCH',
    scopeId: 'branch-1',
    score: { toNumber: () => 50 },
    computedAt: new Date('2026-08-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PulseScoreService', () => {
  function buildService() {
    const engagementSignalRepository = { countByTypeInWindow: jest.fn() };
    const pulseScoreRepository = { upsert: jest.fn(), findChurchPulseWeights: jest.fn() };
    const pulseScoreHistoryRepository = { append: jest.fn() };
    const alertService = { evaluateAndCreateIfNeeded: jest.fn() };
    const service = new PulseScoreService(
      engagementSignalRepository as never,
      pulseScoreRepository as never,
      pulseScoreHistoryRepository as never,
      alertService as never,
    );
    return { service, engagementSignalRepository, pulseScoreRepository, pulseScoreHistoryRepository, alertService };
  }

  describe('computeAndStoreBranchScore', () => {
    it('scopes the signal-count query to the whole Branch (no groupId filter)', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await service.computeAndStoreBranchScore('branch-1');

      const [branchId, groupId] = engagementSignalRepository.countByTypeInWindow.mock.calls[0];
      expect(branchId).toBe('branch-1');
      expect(groupId).toBeUndefined();
    });

    it('upserts the current PulseScore and appends a PulseScoreHistory point, then evaluates alerts', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository, pulseScoreHistoryRepository, alertService } = buildService();
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'ATTENDANCE', count: 10 }]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      const result = await service.computeAndStoreBranchScore('branch-1');

      expect(pulseScoreRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1' }),
      );
      expect(pulseScoreHistoryRepository.append).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1' }),
      );
      expect(alertService.evaluateAndCreateIfNeeded).toHaveBeenCalledWith('branch-1', 'BRANCH', 'branch-1', expect.any(Date));
      expect(result.id).toBe('score-1');
    });

    it('ignores unrecognized signalType rows rather than throwing', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'SOMETHING_UNMODELED', count: 99 }]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await expect(service.computeAndStoreBranchScore('branch-1')).resolves.toBeDefined();
    });
  });

  describe('computeAndStoreGroupScore', () => {
    it('scopes the signal-count query to the given Group', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord({ scopeType: 'GROUP', scopeId: 'group-1' }));

      await service.computeAndStoreGroupScore('branch-1', 'group-1');

      const [branchId, groupId] = engagementSignalRepository.countByTypeInWindow.mock.calls[0];
      expect(branchId).toBe('branch-1');
      expect(groupId).toBe('group-1');
    });
  });

  it('falls back to configured weights when the Branch has church_pulse_weights set', async () => {
    const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
    engagementSignalRepository.countByTypeInWindow.mockResolvedValue([]);
    pulseScoreRepository.findChurchPulseWeights.mockResolvedValue({ ATTENDANCE: 1 });
    pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

    await expect(service.computeAndStoreBranchScore('branch-1')).resolves.toBeDefined();
    expect(pulseScoreRepository.findChurchPulseWeights).toHaveBeenCalledWith('branch-1');
  });
});
