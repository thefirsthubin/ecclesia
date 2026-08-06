import { ChurchPulseRecomputeJob } from './church-pulse-recompute.job';

describe('ChurchPulseRecomputeJob', () => {
  // `[Bug fix]` `computeAndStore`/`evaluateAndCreateAlertIfNeeded` build
  // `now` from the real system clock (`new Date()` inside
  // `church-pulse-recompute.job.ts` - not injected, so it can't be
  // stubbed via a constructor argument). The two tests below feed
  // `findRecentHistoryByScope` fixed, hardcoded history timestamps
  // (2026-07-15 / 2026-08-01) and rely on both landing inside
  // `evaluatePulseTrend`'s 21-day trailing window relative to *real*
  // "now" - which only holds while the suite happens to run on or
  // before 2026-08-05T00:00:00.000Z (`windowStart = now - 21d <=
  // 2026-07-15T00:00:00.000Z`). Run this suite on or after that
  // instant (confirmed failing via a real `pnpm test` run on
  // 2026-08-05) and `evaluatePulseTrend` silently drops the July point
  // from its window, collapsing `earliest`/`latest` to the same August
  // point and producing a 0-point delta instead of the intended
  // 20-point decline - not a logic bug in `evaluatePulseTrend` itself
  // (its window-filtering is correct), just a test fixture that decays
  // with the real calendar. Pinning the clock makes the window's
  // relationship to the fixture dates deterministic regardless of when
  // the suite actually runs.
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function buildJob() {
    const repository = {
      listActiveBacentaGroups: jest.fn(),
      countSignalsByTypeInWindow: jest.fn(),
      findChurchPulseWeights: jest.fn(),
      upsertPulseScore: jest.fn(),
      appendPulseScoreHistory: jest.fn(),
      findRecentHistoryByScope: jest.fn(),
      hasOpenAlert: jest.fn(),
      createAlert: jest.fn(),
    };
    const branchDirectory = { listBranches: jest.fn() };
    const prisma = { runInBranchScope: jest.fn((_branchId: string, fn: () => unknown) => fn()) };
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const job = new ChurchPulseRecomputeJob(repository as never, branchDirectory as never, prisma as never, logger as never);
    return { job, repository, branchDirectory };
  }

  it('recomputes Branch scope plus every active Bacenta scope, and returns the total scope count', async () => {
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
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
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
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
    const { job, repository, branchDirectory } = buildJob();
    branchDirectory.listBranches.mockResolvedValue([{ id: 'branch-1' }]);
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
