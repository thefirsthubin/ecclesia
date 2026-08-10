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
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 10 }]);
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

    it('maps a real published event type to its Church Pulse category and produces a non-zero score (regression test for the eventType/category vocabulary gap)', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      // 'attendance.recorded' is the literal apps/api/src/modules/gatherings/services/attendance-record.service.ts
      // actually publishes - not the bare 'ATTENDANCE' category name.
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 10 }]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await service.computeAndStoreBranchScore('branch-1');

      // 10 signals fully saturates ATTENDANCE; equal-sixths weighting caps
      // one saturated category at 100/6 - identical assertion shape to
      // libs/domain/insights's own computeChurchPulseScore spec.
      expect(pulseScoreRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ score: expect.closeTo(100 / 6, 1) }));
    });

    it('sums two different real event types that map to the same category, rather than overwriting one with the other', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      // Both are real, distinct, currently-published event types (see
      // attendance-record.service.ts) that both map to ATTENDANCE -
      // countByTypeInWindow groups by the raw signalType, so these arrive
      // as two separate rows that must be accumulated, not overwritten.
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([
        { signalType: 'attendance.recorded', count: 6 },
        { signalType: 'bacenta_meeting.attendance_recorded', count: 4 },
      ]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await service.computeAndStoreBranchScore('branch-1');

      // 6 + 4 = 10 == full saturation for ATTENDANCE, same result as the
      // single-event-type test above - proves accumulation, not just mapping.
      expect(pulseScoreRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ score: expect.closeTo(100 / 6, 1) }));
    });

    it('ignores unrecognized signalType rows rather than throwing', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'SOMETHING_UNMODELED', count: 99 }]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await expect(service.computeAndStoreBranchScore('branch-1')).resolves.toBeDefined();
    });

    it('does not let a real, published-but-excluded event type (an SLA-breach/drift alert, not an engagement action) contribute to the score', async () => {
      const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
      // A real event type published by apps/worker's follow-up-sla-sweep -
      // a breach alert, not a person's engagement action. Must not
      // contribute to FOLLOW_UP_OUTCOME (or any category).
      engagementSignalRepository.countByTypeInWindow.mockResolvedValue([
        { signalType: 'pastoral_care.follow_up_task_sla_breached', count: 50 },
      ]);
      pulseScoreRepository.findChurchPulseWeights.mockResolvedValue(null);
      pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

      await service.computeAndStoreBranchScore('branch-1');

      expect(pulseScoreRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ score: 0 }));
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

  it('produces a non-zero score when church_pulse_weights is {} - the actual NOT NULL column default, not just when it is null (regression test for "Church Pulse always 0")', async () => {
    const { service, engagementSignalRepository, pulseScoreRepository } = buildService();
    engagementSignalRepository.countByTypeInWindow.mockResolvedValue([{ signalType: 'attendance.recorded', count: 10 }]);
    // {} - a Branch that has never touched the weight-configuration screen,
    // not `null`. This is what `platform.configurations.church_pulse_weights`
    // actually holds by default (a NOT NULL JSONB column).
    pulseScoreRepository.findChurchPulseWeights.mockResolvedValue({});
    pulseScoreRepository.upsert.mockResolvedValue(pulseScoreRecord());

    await service.computeAndStoreBranchScore('branch-1');

    expect(pulseScoreRepository.upsert).toHaveBeenCalledWith(expect.objectContaining({ score: expect.closeTo(100 / 6, 1) }));
  });
});
