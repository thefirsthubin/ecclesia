import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { InsightsPage } from './InsightsPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', ...extra },
    },
  };
}

function branchDashboard() {
  return {
    branchId: 'branch-1',
    pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 80, computedAt: new Date().toISOString() },
    alerts: [],
  };
}

/** `[UX Design Implementation]` Final UX Design Specification §14
 * (decision 8) - `BranchTrendsSection` (rendered here for RESIDENT_PASTOR/
 * ACTING_RESIDENT_PASTOR/ADMIN) calls `GET /insights/branch-dashboard-summary`
 * - needs its own real shape, the same "URL-branched fetch mock" precedent
 * this file's own ASSISTANT_PASTOR test already established for
 * `/groups/`, or `growthSeriesFromSummary` crashes reading `.growthSeries`
 * off the generic `branchDashboard()` shape every other call here returns. */
function branchDashboardSummary() {
  return {
    branchId: 'branch-1',
    membersCount: 482,
    membersTrend: 12,
    attendanceTotal: 356,
    attendanceTrend: -8,
    givingTotalMinor: '2450000',
    givingTrend: 8,
    growthSeries: {
      attendance: [{ label: 'Aug', value: 356 }],
      membership: [{ label: 'Aug', value: 482 }],
      giving: [{ label: 'Aug', value: 2450000 }],
    },
    volunteersCount: 67,
    volunteersTrend: -2,
    bacentaLeaderboard: [{ groupId: 'bacenta-1', name: 'Grace Bacenta', leaderName: 'Grace Owusu', score: 91 }],
    engagementTrend: { direction: 'up', deltaPoints: 6, windowDays: 21 },
  };
}

function residentPastorFetchMock() {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('/insights/branch-dashboard-summary')) {
      return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
    }
    return Promise.resolve({ ok: true, json: async () => branchDashboard() });
  });
}

/**
 * `[Remaining Engineering Sprint, Milestone 11 - real jest run fix]` Now
 * wraps `RouterProvider` too. `InsightsPage` renders `ResidentPastorDashboard`
 * for `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` (§ "same Branch dashboard
 * as /dashboard"), which renders `QuickActionsRow` - `useNavigate()`
 * throws outside a `RouterProvider` by design (`router.tsx`'s own
 * `useRouterContext()`). This dependency predates Milestone 11 (the
 * Dashboard Redesign sprint wired `QuickActionsRow` into
 * `ResidentPastorDashboard`), but `jest` never actually executed in any
 * sandbox session before now to catch it - the first real run surfaced a
 * latent gap, not a regression this sprint introduced.
 */
function renderPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <InsightsPage />
      </RouterProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('InsightsPage', () => {
  /** `[UX Design Implementation]` Final UX Design Specification §14
   * (decision 8) - Insights no longer duplicates Dashboard's Church Pulse
   * hero/Alerts; it shows `BranchTrendsSection`'s trend content instead
   * (growth chart, Bacenta Leaderboard, Engagement Trend), sourced from
   * the same real `GET /insights/branch-dashboard-summary` endpoint. */
  it('renders the growth chart, Bacenta Leaderboard, and Engagement Trend for RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = residentPastorFetchMock();

    renderPage();

    await waitFor(() => expect(screen.getByTestId('performance-chart-card')).toBeInTheDocument());
    expect(screen.getByTestId('engagement-trend-card')).toHaveTextContent('+6');
    expect(screen.getByTestId('bacenta-leaderboard-card')).toHaveTextContent('Grace Bacenta');
    // No longer duplicates Dashboard's own Church Pulse hero/Alerts here.
    expect(screen.queryByTestId('church-pulse-card')).not.toBeInTheDocument();
  });

  it('renders the same trend view for ACTING_RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ACTING_RESIDENT_PASTOR'));
    global.fetch = residentPastorFetchMock();

    renderPage();

    await waitFor(() => expect(screen.getByTestId('performance-chart-card')).toBeInTheDocument());
  });

  /** `ADMIN` previously saw *less* here than on their own Dashboard - now
   * renders the identical `BranchTrendsSection` RESIDENT_PASTOR does,
   * since both roles hold the same `insights.branch_dashboard.read`
   * grant (traced in `permission-matrix.ts`, not assumed). */
  it('renders the same trend view for ADMIN, resolving the "Insights showed less than Dashboard" gap', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = residentPastorFetchMock();

    renderPage();

    await waitFor(() => expect(screen.getByTestId('performance-chart-card')).toBeInTheDocument());
    expect(screen.getByTestId('bacenta-leaderboard-card')).toBeInTheDocument();
  });

  /** `[Branch Pastor portal, Insights rebuild]` `ClusterInsightsView`'s
   * single-Bacenta-at-a-time picker was replaced (not refined) by
   * `BranchInsightsView` - the real Branch-wide trend charts, a ranked
   * Bacenta health comparison, and a real overdue-Follow-up count. */
  it('renders the Branch performance trend, ranked Bacenta health, and overdue Follow-ups for ASSISTANT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      if (url.includes('/insights/cluster-dashboard/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            groupId: 'bacenta-1',
            pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 50, computedAt: new Date().toISOString() },
            alerts: [],
          }),
        });
      }
      if (url.includes('/groups/')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Bacenta One' }) });
      if (url.includes('/pastoral-care/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('insights-attendance-trend-card')).toBeInTheDocument());
    expect(screen.getByTestId('insights-giving-trend-card')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Bacenta One')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Nothing is overdue across your cluster right now.')).toBeInTheDocument());
  });

  it('shows a not-available message for a role with no Insights scope', () => {
    mockUseAuth.mockReturnValue(actorWithRole('WORKER'));

    renderPage();

    expect(screen.getByText('Insights — not available for this role')).toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 1: Branch Treasurer]`
   * `TREASURER` previously fell to the generic "not available" stub -
   * now renders `TreasurerInsightsView`, real `GET /insights/giving-trend`
   * data. */
  it('renders the giving trend chart and real totals for TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-09-01T00:00:00.000Z',
        buckets: [
          { bucketStart: '2026-07-01T00:00:00.000Z', bucketEnd: '2026-08-01T00:00:00.000Z', label: 'Jul 2026', totalAmountMinor: '100000', byType: { OFFERING: '60000', TITHE: '40000' } },
          { bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', totalAmountMinor: '150000', byType: { OFFERING: '90000', TITHE: '60000' } },
        ],
        unattributedAmountMinor: '0',
        unmappedGatheringTypes: [],
      }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('treasurer-insights-line-chart')).toBeInTheDocument());
    expect(screen.getByTestId('metric-insights-total')).toHaveTextContent('GHS 2,500.00');
    expect(screen.getByTestId('metric-insights-latest')).toHaveTextContent('GHS 1,500.00');
    expect(screen.getByTestId('metric-insights-direction')).toHaveTextContent('Increasing');
    expect(screen.getByTestId('metric-insights-growth')).toHaveTextContent('+50%');
  });

  /** `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
   * `BACENTA_LEADER` previously fell to the shared "lives on mobile" stub -
   * now renders `BacentaLeaderInsightsView`, real `GET
   * /insights/attendance-trend` data (the default "Attendance" metric
   * tab), `groupId`-scoped to this leader's own Bacenta. */
  it('renders the attendance trend chart for BACENTA_LEADER, scoped to their own Bacenta', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-09-01T00:00:00.000Z',
        buckets: [
          { bucketStart: '2026-07-01T00:00:00.000Z', bucketEnd: '2026-08-01T00:00:00.000Z', label: 'Jul 2026', presentCount: 10 },
          { bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', presentCount: 15 },
        ],
        byGroup: [],
        unmappedGatheringTypes: [],
      }),
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByTestId('bacenta-attendance-line-chart')).toBeInTheDocument());
    expect(screen.getByTestId('metric-attendance-latest')).toHaveTextContent('15');
    expect(screen.getByTestId('metric-attendance-trend')).toHaveTextContent('Increasing');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=bacenta-1');
  });

  /** `[Milestone D — Portal Experiences, Portal 4: Basonta Leader]`
   * `BASONTA_LEADER` previously fell to the shared "lives on mobile" stub -
   * now renders `BasontaLeaderInsightsView`, real `GET
   * /insights/attendance-trend` data, `groupId`-scoped to this leader's
   * own Basonta. */
  it('renders the attendance trend chart for BASONTA_LEADER, scoped to their own Basonta', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BASONTA_LEADER', { basontaId: 'basonta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        from: '2026-03-01T00:00:00.000Z',
        to: '2026-09-01T00:00:00.000Z',
        buckets: [
          { bucketStart: '2026-07-01T00:00:00.000Z', bucketEnd: '2026-08-01T00:00:00.000Z', label: 'Jul 2026', presentCount: 6 },
          { bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', presentCount: 9 },
        ],
        byGroup: [],
        unmappedGatheringTypes: [],
      }),
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByTestId('basonta-attendance-line-chart')).toBeInTheDocument());
    expect(screen.getByTestId('metric-attendance-latest')).toHaveTextContent('9');
    expect(screen.getByTestId('metric-attendance-trend')).toHaveTextContent('Increasing');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('groupId=basonta-1');
  });

  /** `[Milestone D — Portal Experiences, Portal 7: Council]`
   * `COUNCIL_OVERSEER` previously fell to the shared "not available for
   * this role" stub - now renders `CouncilInsightsView`, real
   * `council=true` giving-trend data (the default "Giving" metric),
   * one panel per real Branch in the actor's own Council. */
  it('renders the giving trend chart for COUNCIL_OVERSEER, council=true scoped', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_OVERSEER', { branchName: 'Headquarters' }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/platform/branches')) return Promise.resolve({ ok: true, json: async () => [{ id: 'branch-1', name: 'Headquarters' }] });
      return Promise.resolve({
        ok: true,
        json: async () => ({
          councilBranches: [
            {
              branchId: 'branch-1',
              from: '2026-03-01T00:00:00.000Z',
              to: '2026-09-01T00:00:00.000Z',
              buckets: [
                { bucketStart: '2026-07-01T00:00:00.000Z', bucketEnd: '2026-08-01T00:00:00.000Z', label: 'Jul 2026', totalAmountMinor: '100000', byType: {} },
                { bucketStart: '2026-08-01T00:00:00.000Z', bucketEnd: '2026-09-01T00:00:00.000Z', label: 'Aug 2026', totalAmountMinor: '150000', byType: {} },
              ],
              unattributedAmountMinor: '0',
              unmappedGatheringTypes: [],
            },
          ],
        }),
      });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByTestId('council-insights-branch-card')).toBeInTheDocument());
    expect(screen.getByText('Headquarters')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('council-giving-line-chart')).toBeInTheDocument());
    expect(screen.getByTestId('metric-council-giving-latest')).toHaveTextContent('GHS 1,500.00');
    const [url] = fetchMock.mock.calls.find(([callUrl]) => (callUrl as string).includes('/insights/giving-trend')) as [string];
    expect(url).toContain('council=true');
  });

  it('offers only the Giving metric for COUNCIL_TREASURER - no metric selector, since it is the only grant this role holds', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_TREASURER', { branchName: 'Headquarters' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/platform/branches')) return Promise.resolve({ ok: true, json: async () => [{ id: 'branch-1', name: 'Headquarters' }] });
      return Promise.resolve({
        ok: true,
        json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }] }),
      });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('council-insights-branch-card')).toBeInTheDocument());
    expect(screen.queryByRole('group', { name: 'Metric' })).not.toBeInTheDocument();
  });
});
