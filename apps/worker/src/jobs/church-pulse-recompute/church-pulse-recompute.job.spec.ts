import { ChurchPulseRecomputeJob } from './church-pulse-recompute.job';

describe('ChurchPulseRecomputeJob', () => {
  function buildJob() {
    const repository = {
      listBranches: jest.fn(),
      listActiveBacentaGroups: jest.fn(),
      countSignalsByTypeInWindow: jest.fn(),
      findChurchPulseWeights: jest.fn(),
      upsertPulseScore: jest.fn(),
      appendPulseScoreHistory: jest.fn(),
      findRecentHistoryByScope: jest.fn(),
      hasOpenAlert: jest.fn(),
      createAlert: jest.fn(),
    };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new ChurchPulseRecomputeJob(repository as never, logger as never);
    return { job, repository };
  }

  it('recomputes Branch scope plus every active Bacenta scope, and returns the total scope count', async () => {
    const { job, repository } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([{ id: 'group-1' }, { id: 'group-2' }]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([{ signalType: 'ATTENDANCE', count: 5 }]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([]);

    const scopeCount = await job.run();

    expect(scopeCount).toBe(3); // 1 BRANCH + 2 GROUP
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1' }),
    );
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-1' }),
    );
    expect(repository.upsertPulseScore).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'group-2' }),
    );
    expect(repository.appendPulseScoreHistory).toHaveBeenCalledTimes(3);
  });

  it('creates a PULSE_DECLINE alert when the trend has declined and none is already open', async () => {
    const { job, repository } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([
      { score: { toNumber: () => 80 }, computedAt: new Date('2026-07-15T00:00:00.000Z') },
      { score: { toNumber: () => 60 }, computedAt: new Date('2026-08-01T00:00:00.000Z') },
    ]);
    repository.hasOpenAlert.mockResolvedValue(false);

    await job.run();

    expect(repository.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', alertType: 'PULSE_DECLINE' }),
    );
  });

  it('does not create a duplicate alert when one is already open', async () => {
    const { job, repository } = buildJob();
    repository.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
    repository.listActiveBacentaGroups.mockResolvedValue([]);
    repository.countSignalsByTypeInWindow.mockResolvedValue([]);
    repository.findChurchPulseWeights.mockResolvedValue(null);
    repository.upsertPulseScore.mockResolvedValue({});
    repository.appendPulseScoreHistory.mockResolvedValue({});
    repository.findRecentHistoryByScope.mockResolvedValue([
      { score: { toNumber: () => 80 }, computedAt: new Date('2026-07-15T00:00:00.000Z') },
      { score: { toNumber: () => 60 }, computedAt: new Date('2026-08-01T00:00:00.000Z') },
    ]);
    repository.hasOpenAlert.mockResolvedValue(true);

    await job.run();

    expect(repository.createAlert).not.toHaveBeenCalled();
  });
});
