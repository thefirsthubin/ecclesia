import { BranchDashboardSummaryService } from './branch-dashboard-summary.service';

describe('BranchDashboardSummaryService', () => {
  // Fixed "now" mid-August 2026 so every month-boundary/label/trend
  // assertion below is deterministic, not dependent on the real calendar
  // date the test suite happens to run on.
  const NOW = new Date('2026-08-15T12:00:00.000Z');

  function buildService() {
    const personService = { countByBranch: jest.fn(), countByBranchCreatedBefore: jest.fn(), getById: jest.fn() };
    const attendanceRecordService = { countPresentInWindow: jest.fn() };
    const financialTransactionService = { sumVerifiedAmountForBranch: jest.fn() };
    const groupMembershipService = { countDistinctActiveMinistryMembersByBranch: jest.fn() };
    const groupService = { listActiveBacentasForBranch: jest.fn() };
    const groupLeadershipService = { getActiveBacentaLeaderPersonId: jest.fn() };
    const pulseScoreRepository = { findByBranchAndScopeType: jest.fn() };
    const pulseScoreHistoryRepository = { findRecentByScope: jest.fn() };
    const service = new BranchDashboardSummaryService(
      personService as never,
      attendanceRecordService as never,
      financialTransactionService as never,
      groupMembershipService as never,
      groupService as never,
      groupLeadershipService as never,
      pulseScoreRepository as never,
      pulseScoreHistoryRepository as never,
    );
    return {
      service,
      personService,
      attendanceRecordService,
      financialTransactionService,
      groupMembershipService,
      groupService,
      groupLeadershipService,
      pulseScoreRepository,
      pulseScoreHistoryRepository,
    };
  }

  /** Every test below needs *some* resolved value for every one of the 6
   * monthly calls each dependency receives - this sets a flat baseline so
   * each test only has to override the specific call(s) it cares about. */
  function stubFlatBaseline(mocks: ReturnType<typeof buildService>) {
    mocks.personService.countByBranch.mockResolvedValue(0);
    mocks.personService.countByBranchCreatedBefore.mockResolvedValue(0);
    mocks.attendanceRecordService.countPresentInWindow.mockResolvedValue(0);
    mocks.financialTransactionService.sumVerifiedAmountForBranch.mockResolvedValue(0n);
    mocks.groupMembershipService.countDistinctActiveMinistryMembersByBranch.mockResolvedValue(0);
    mocks.groupService.listActiveBacentasForBranch.mockResolvedValue([]);
    mocks.pulseScoreRepository.findByBranchAndScopeType.mockResolvedValue([]);
    mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([]);
  }

  describe('six-month series and date-window calculations', () => {
    it('computes exactly 6 monthly [start, end) windows, oldest first, ending at the current in-progress month', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      await mocks.service.getSummary('branch-1', NOW);

      const attendanceCalls = mocks.attendanceRecordService.countPresentInWindow.mock.calls;
      expect(attendanceCalls).toHaveLength(6);
      // Oldest first: March through August 2026.
      expect(attendanceCalls[0]).toEqual(['branch-1', new Date('2026-03-01T00:00:00.000Z'), new Date('2026-04-01T00:00:00.000Z')]);
      expect(attendanceCalls[1]).toEqual(['branch-1', new Date('2026-04-01T00:00:00.000Z'), new Date('2026-05-01T00:00:00.000Z')]);
      expect(attendanceCalls[2]).toEqual(['branch-1', new Date('2026-05-01T00:00:00.000Z'), new Date('2026-06-01T00:00:00.000Z')]);
      expect(attendanceCalls[3]).toEqual(['branch-1', new Date('2026-06-01T00:00:00.000Z'), new Date('2026-07-01T00:00:00.000Z')]);
      expect(attendanceCalls[4]).toEqual(['branch-1', new Date('2026-07-01T00:00:00.000Z'), new Date('2026-08-01T00:00:00.000Z')]);
      // The current, in-progress month - end boundary is the 1st of the
      // *next* month, not "now" - a live dashboard viewed mid-month still
      // gets the whole month's window, matching a real `[from, to)` range
      // query rather than an ever-shifting "up to this exact instant" one.
      expect(attendanceCalls[5]).toEqual(['branch-1', new Date('2026-08-01T00:00:00.000Z'), new Date('2026-09-01T00:00:00.000Z')]);
    });

    it('labels the growth series with the correct 3-letter month abbreviations, in order', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.growthSeries.attendance.map((point) => point.label)).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']);
      expect(result.growthSeries.membership.map((point) => point.label)).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']);
      expect(result.growthSeries.giving.map((point) => point.label)).toEqual(['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']);
    });

    it('spans a calendar-year boundary correctly (Aug 2026 back through Mar is within-year, but Jan/Feb back-references land in the prior year)', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      const januaryNow = new Date('2026-01-15T00:00:00.000Z');

      await mocks.service.getSummary('branch-1', januaryNow);

      const calls = mocks.attendanceRecordService.countPresentInWindow.mock.calls;
      // Aug 2025 through Jan 2026 - JS's Date normalizes a negative month
      // index into the prior year automatically (`Date.UTC(2026, -4, 1)`
      // === August 2025), which is exactly the behavior this relies on
      // rather than hand-rolling year rollover.
      expect(calls[0]).toEqual(['branch-1', new Date('2025-08-01T00:00:00.000Z'), new Date('2025-09-01T00:00:00.000Z')]);
      expect(calls[5]).toEqual(['branch-1', new Date('2026-01-01T00:00:00.000Z'), new Date('2026-02-01T00:00:00.000Z')]);
    });
  });

  describe('branch-scoped aggregation / cross-branch isolation', () => {
    it('passes the exact given branchId - never a hardcoded or client-suppliable value - to every dependency call', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      await mocks.service.getSummary('branch-xyz', NOW);

      expect(mocks.personService.countByBranch).toHaveBeenCalledWith('branch-xyz');
      for (const call of mocks.personService.countByBranchCreatedBefore.mock.calls) {
        expect(call[0]).toBe('branch-xyz');
      }
      for (const call of mocks.attendanceRecordService.countPresentInWindow.mock.calls) {
        expect(call[0]).toBe('branch-xyz');
      }
      for (const call of mocks.financialTransactionService.sumVerifiedAmountForBranch.mock.calls) {
        expect(call[0]).toBe('branch-xyz');
      }
    });

    it('two different branches never share a call - calling for branch-a never queries with branch-b\'s id', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      await mocks.service.getSummary('branch-a', NOW);

      const allBranchIdsQueried = new Set([
        ...mocks.personService.countByBranchCreatedBefore.mock.calls.map((call) => call[0]),
        ...mocks.attendanceRecordService.countPresentInWindow.mock.calls.map((call) => call[0]),
        ...mocks.financialTransactionService.sumVerifiedAmountForBranch.mock.calls.map((call) => call[0]),
      ]);
      expect(allBranchIdsQueried).toEqual(new Set(['branch-a']));
      expect(allBranchIdsQueried.has('branch-b')).toBe(false);
    });
  });

  describe('members', () => {
    it('membersCount is the current total, membersTrend is a signed count (not a percentage) of Persons created this month', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.personService.countByBranch.mockResolvedValue(482);
      // countByBranchCreatedBefore is called once for "start of this
      // month" (membersTrend) and once per of the 6 series boundaries
      // (growthSeries.membership) - the start-of-month call is a *tighter*
      // cutoff than any series point before it, so distinguish by the
      // cutoff Date argument itself rather than call order.
      mocks.personService.countByBranchCreatedBefore.mockImplementation((_branchId: string, cutoff: Date) =>
        Promise.resolve(cutoff.getTime() === new Date('2026-08-01T00:00:00.000Z').getTime() ? 470 : 0),
      );

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.membersCount).toBe(482);
      expect(result.membersTrend).toBe(12); // 482 - 470, an absolute count
    });

    it('growthSeries.membership is a cumulative snapshot per month (monotonically non-decreasing), not a per-month new-members count', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      const snapshotsByMonthEnd: Record<string, number> = {
        '2026-04-01T00:00:00.000Z': 451,
        '2026-05-01T00:00:00.000Z': 458,
        '2026-06-01T00:00:00.000Z': 462,
        '2026-07-01T00:00:00.000Z': 470,
        '2026-08-01T00:00:00.000Z': 476,
        '2026-09-01T00:00:00.000Z': 482,
      };
      mocks.personService.countByBranchCreatedBefore.mockImplementation((_branchId: string, cutoff: Date) =>
        Promise.resolve(snapshotsByMonthEnd[cutoff.toISOString()] ?? 0),
      );

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.growthSeries.membership.map((point) => point.value)).toEqual([451, 458, 462, 470, 476, 482]);
    });
  });

  describe('attendance (PRESENT semantics)', () => {
    it('attendanceTotal is the current month\'s PRESENT count, exactly the last growth-series point', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.attendanceRecordService.countPresentInWindow.mockResolvedValueOnce(398).mockResolvedValueOnce(384).mockResolvedValueOnce(372).mockResolvedValueOnce(368).mockResolvedValueOnce(361).mockResolvedValueOnce(356);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.attendanceTotal).toBe(356);
      expect(result.growthSeries.attendance.map((point) => point.value)).toEqual([398, 384, 372, 368, 361, 356]);
    });

    it('attendanceTrend is a signed whole-number percentage vs. the immediately preceding full month', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      // ... Jun=368, Jul=361, Aug=356 -> trend compares Jul (361) to Aug (356).
      mocks.attendanceRecordService.countPresentInWindow
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(368)
        .mockResolvedValueOnce(361)
        .mockResolvedValueOnce(356);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.attendanceTrend).toBe(-1); // round((356-361)/361 * 100) = -1
    });
  });

  describe('giving (verified semantics)', () => {
    it('givingTotalMinor is the current month\'s verified sum, as a decimal string in minor units', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.financialTransactionService.sumVerifiedAmountForBranch
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(2268000n)
        .mockResolvedValueOnce(2450000n);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.givingTotalMinor).toBe('2450000');
      expect(typeof result.givingTotalMinor).toBe('string');
    });

    it('growthSeries.giving values are plain numbers in minor units, not pre-converted to major currency units', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.financialTransactionService.sumVerifiedAmountForBranch.mockResolvedValueOnce(1980000n).mockResolvedValue(2060000n);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.growthSeries.giving[0].value).toBe(1980000);
      expect(typeof result.growthSeries.giving[0].value).toBe('number');
    });

    it('givingTrend compares the last two months as a signed whole-number percentage', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.financialTransactionService.sumVerifiedAmountForBranch
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(2268000n)
        .mockResolvedValueOnce(2450000n);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.givingTrend).toBe(8); // round((2450000-2268000)/2268000 * 100) = 8
    });
  });

  describe('trend calculations - edge cases', () => {
    it('treats a zero previous-month baseline as a flat (0%) trend, not Infinity/NaN', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.attendanceRecordService.countPresentInWindow
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0) // previous month: 0
        .mockResolvedValueOnce(50); // current month: 50

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.attendanceTrend).toBe(0);
      expect(Number.isFinite(result.attendanceTrend)).toBe(true);
    });

    it('a decline produces a negative trend', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.financialTransactionService.sumVerifiedAmountForBranch
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(0n)
        .mockResolvedValueOnce(1000n)
        .mockResolvedValueOnce(500n);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.givingTrend).toBe(-50);
    });
  });

  it('echoes the given branchId on the response', async () => {
    const mocks = buildService();
    stubFlatBaseline(mocks);

    const result = await mocks.service.getSummary('branch-echo', NOW);

    expect(result.branchId).toBe('branch-echo');
  });

  describe('volunteers (active MINISTRY membership semantics)', () => {
    it('volunteersCount is the current distinct-active-MINISTRY-member count, branch-scoped', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupMembershipService.countDistinctActiveMinistryMembersByBranch.mockResolvedValue(67);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.volunteersCount).toBe(67);
      expect(mocks.groupMembershipService.countDistinctActiveMinistryMembersByBranch).toHaveBeenCalledWith('branch-1');
    });

    it('volunteersTrend is a signed count (current minus the count as of the start of this month), not a percentage', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupMembershipService.countDistinctActiveMinistryMembersByBranch
        .mockResolvedValueOnce(67) // current (no `asOf` argument)
        .mockResolvedValueOnce(69); // as of start of this month

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.volunteersTrend).toBe(-2);
      expect(mocks.groupMembershipService.countDistinctActiveMinistryMembersByBranch).toHaveBeenCalledWith(
        'branch-1',
        new Date('2026-08-01T00:00:00.000Z'),
      );
    });

    it('reports 0 count and 0 trend for a branch with no Ministry memberships at all', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.volunteersCount).toBe(0);
      expect(result.volunteersTrend).toBe(0);
    });
  });

  describe('bacenta leaderboard (read-only, never recomputes)', () => {
    it('includes only active Bacentas that already have a computed score, ordered highest first', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupService.listActiveBacentasForBranch.mockResolvedValue([
        { id: 'bacenta-4', name: 'Bacenta 4' },
        { id: 'bacenta-9', name: 'Bacenta 9' },
        { id: 'bacenta-12', name: 'Bacenta 12' },
      ]);
      mocks.pulseScoreRepository.findByBranchAndScopeType.mockResolvedValue([
        { scopeId: 'bacenta-9', score: { toNumber: () => 78 } },
        { scopeId: 'bacenta-4', score: { toNumber: () => 91 } },
        // bacenta-12 deliberately has no score row - the sweep hasn't reached it yet.
      ]);
      mocks.groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue(undefined);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.bacentaLeaderboard.map((entry) => entry.groupId)).toEqual(['bacenta-4', 'bacenta-9']);
      expect(result.bacentaLeaderboard[0].score).toBe(91);
      expect(result.bacentaLeaderboard[1].score).toBe(78);
      expect(mocks.pulseScoreRepository.findByBranchAndScopeType).toHaveBeenCalledWith('branch-1', 'GROUP');
    });

    // "Never recomputes a score" is structurally guaranteed, not just
    // runtime-tested: `BranchDashboardSummaryService`'s constructor has no
    // `PulseScoreService` dependency at all (only the plain
    // `PulseScoreRepository` read used above) - there is no compute-on-read
    // method reachable from this class for a test to accidentally call.

    it('resolves the active Bacenta Leader\'s real name onto each entry', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupService.listActiveBacentasForBranch.mockResolvedValue([{ id: 'bacenta-4', name: 'Bacenta 4' }]);
      mocks.pulseScoreRepository.findByBranchAndScopeType.mockResolvedValue([{ scopeId: 'bacenta-4', score: { toNumber: () => 91 } }]);
      mocks.groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue('leader-1');
      mocks.personService.getById.mockResolvedValue({ firstName: 'Grace', lastName: 'Owusu' });

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.bacentaLeaderboard[0].leaderName).toBe('Grace Owusu');
      expect(mocks.groupLeadershipService.getActiveBacentaLeaderPersonId).toHaveBeenCalledWith('bacenta-4');
    });

    it('reports leaderName: null, not a fabricated name, for a vacant Bacenta', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupService.listActiveBacentasForBranch.mockResolvedValue([{ id: 'bacenta-4', name: 'Bacenta 4' }]);
      mocks.pulseScoreRepository.findByBranchAndScopeType.mockResolvedValue([{ scopeId: 'bacenta-4', score: { toNumber: () => 91 } }]);
      mocks.groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue(undefined);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.bacentaLeaderboard[0].leaderName).toBeNull();
      expect(mocks.personService.getById).not.toHaveBeenCalled();
    });

    it('a Person lookup failure for the resolved leader degrades to leaderName: null rather than failing the whole leaderboard', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.groupService.listActiveBacentasForBranch.mockResolvedValue([{ id: 'bacenta-4', name: 'Bacenta 4' }]);
      mocks.pulseScoreRepository.findByBranchAndScopeType.mockResolvedValue([{ scopeId: 'bacenta-4', score: { toNumber: () => 91 } }]);
      mocks.groupLeadershipService.getActiveBacentaLeaderPersonId.mockResolvedValue('leader-1');
      mocks.personService.getById.mockRejectedValue(new Error('No Person found'));

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.bacentaLeaderboard[0].leaderName).toBeNull();
      expect(result.bacentaLeaderboard[0].score).toBe(91);
    });

    it('never leaks another branch\'s Bacentas or scores - both queries are scoped to the exact given branchId', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      await mocks.service.getSummary('branch-only-mine', NOW);

      expect(mocks.groupService.listActiveBacentasForBranch).toHaveBeenCalledWith('branch-only-mine');
      expect(mocks.pulseScoreRepository.findByBranchAndScopeType).toHaveBeenCalledWith('branch-only-mine', 'GROUP');
    });

    it('returns an empty leaderboard, not an error, when the branch has no active Bacentas', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.bacentaLeaderboard).toEqual([]);
    });
  });

  describe('engagement trend (reuses evaluatePulseTrend, never a new computation)', () => {
    it('reads BRANCH-scoped history for the given branchId, over the same window evaluatePulseTrend defaults to', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);

      await mocks.service.getSummary('branch-1', NOW);

      expect(mocks.pulseScoreHistoryRepository.findRecentByScope).toHaveBeenCalledWith(
        'BRANCH',
        'branch-1',
        new Date('2026-07-25T12:00:00.000Z'), // NOW minus the 21-day default window
      );
    });

    it('reports an up direction and a positive deltaPoints for genuinely improving history', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        { score: { toNumber: () => 60 }, computedAt: new Date('2026-07-26T00:00:00.000Z') },
        { score: { toNumber: () => 74 }, computedAt: new Date('2026-08-15T00:00:00.000Z') },
      ]);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.engagementTrend.direction).toBe('up');
      expect(result.engagementTrend.deltaPoints).toBe(14);
      expect(result.engagementTrend.windowDays).toBe(21);
    });

    it('reports a down direction and a negative deltaPoints for declining history', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        { score: { toNumber: () => 80 }, computedAt: new Date('2026-07-26T00:00:00.000Z') },
        { score: { toNumber: () => 65 }, computedAt: new Date('2026-08-15T00:00:00.000Z') },
      ]);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.engagementTrend.direction).toBe('down');
      expect(result.engagementTrend.deltaPoints).toBe(-15);
    });

    it('reports flat/0 rather than a fabricated trend when there is insufficient history (fewer than 2 points)', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        { score: { toNumber: () => 74 }, computedAt: new Date('2026-08-15T00:00:00.000Z') },
      ]);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.engagementTrend.direction).toBe('flat');
      expect(result.engagementTrend.deltaPoints).toBe(0);
    });

    it('reports flat/0 for zero history, not an error', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([]);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.engagementTrend.direction).toBe('flat');
      expect(result.engagementTrend.deltaPoints).toBe(0);
    });

    it('reports flat for exactly-equal scores (no real movement)', async () => {
      const mocks = buildService();
      stubFlatBaseline(mocks);
      mocks.pulseScoreHistoryRepository.findRecentByScope.mockResolvedValue([
        { score: { toNumber: () => 74 }, computedAt: new Date('2026-07-26T00:00:00.000Z') },
        { score: { toNumber: () => 74 }, computedAt: new Date('2026-08-15T00:00:00.000Z') },
      ]);

      const result = await mocks.service.getSummary('branch-1', NOW);

      expect(result.engagementTrend.direction).toBe('flat');
      expect(result.engagementTrend.deltaPoints).toBe(0);
    });
  });
});
