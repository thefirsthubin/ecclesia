import type { ReactElement } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { DashboardPage } from './DashboardPage';

/**
 * `[Dashboard Redesign sprint]` Wraps `RouterProvider` - every persona
 * dashboard renders at least one `useNavigate()`-calling component
 * (`KpiCard`, `QuickActionsRow`, etc.), which throws outside a
 * `RouterProvider` by design (`router.tsx`'s own `useRouterContext()`).
 *
 * `[Remaining Engineering Sprint, Milestone 11]` Now also wraps
 * `ToastProvider` - `MinistryLeaderDashboard` embeds `StaffingTargetsPanel`,
 * which calls `useToast()` unconditionally, the same real requirement
 * `StewardshipPage.spec.tsx`/`BasontaRosterView.spec.tsx` picked up this
 * sprint.
 */
function renderWithProviders(ui: ReactElement) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>{ui}</RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

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

afterEach(() => {
  jest.clearAllMocks();
});

describe('DashboardPage', () => {
  /** `[Resident Pastor Dashboard - real Members/Attendance/Giving data
   * milestone]` `/insights/branch-dashboard-summary` needs its own real
   * shape now too, the same "URL-branched fetch mock" precedent the ADMIN
   * test below already established for `/insights/branch-dashboard` -
   * `membersKpiFromSummary`/`attendanceKpiFromSummary`/`givingKpiFromSummary`
   * would otherwise read `undefined` off the generic `{ pulseScore, alerts }`
   * shape the rest of this file's fetch mocks return. */
  function residentPastorFetchMock() {
    return jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
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
          }),
        });
      }
      if (url.includes('/insights/branch-dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 74, computedAt: new Date().toISOString() },
            alerts: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
  }

  it('renders the Resident Pastor dashboard for RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = residentPastorFetchMock();

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
  });

  it('renders the real Members/Attendance/Giving KPI values (not demo data) for RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = residentPastorFetchMock();

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('kpi-card-members')).toBeInTheDocument());
    expect(screen.getByTestId('kpi-card-members')).toHaveTextContent('482');
    expect(screen.getByTestId('kpi-card-members')).toHaveTextContent('+12 this month');
    expect(screen.getByTestId('kpi-card-attendance')).toHaveTextContent('356');
    expect(screen.getByTestId('kpi-card-giving')).toHaveTextContent('GHS 24,500.00');
    // Volunteers stays demo-sourced - out of this milestone's scope.
    expect(screen.getByTestId('kpi-card-volunteers')).toHaveTextContent('67');
  });

  it('renders the ACTING_RESIDENT_PASTOR the same Branch dashboard', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ACTING_RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderWithProviders(<DashboardPage />);

    // Even on a failed fetch, this is the Resident Pastor dashboard shell
    // (its own ErrorState), not a role-stub.
    await waitFor(() => expect(screen.getByText("Couldn't load Church Pulse")).toBeInTheDocument());
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
   * `BACENTA_LEADER` previously fell to a "lives on mobile" stub - now
   * renders `BacentaLeaderDashboard`, real `GET /people`, `GET
   * /insights/attendance-trend`, and `GET /insights/giving-trend` data,
   * scoped to this leader's own Bacenta. */
  it('renders the real Bacenta Leader dashboard, scoped to their own Bacenta', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/people?groupId=bacenta-1')) return Promise.resolve({ ok: true, json: async () => [{ id: 'p1' }, { id: 'p2' }] });
      if (url.includes('/insights/attendance-trend')) return Promise.resolve({ ok: true, json: async () => ({ from: '', to: '', buckets: [{ label: 'Week', presentCount: 8 }], byGroup: [], unmappedGatheringTypes: [] }) });
      if (url.includes('/insights/giving-trend')) return Promise.resolve({ ok: true, json: async () => ({ from: '', to: '', buckets: [{ label: 'Week', totalAmountMinor: '5000', byType: {} }], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }) });
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('bacenta-leader-metrics-grid')).toBeInTheDocument());
    expect(screen.getByTestId('metric-bacenta-members')).toHaveTextContent('2');
    expect(screen.getByTestId('metric-sunday-attendance')).toHaveTextContent('8');
    expect(screen.getByTestId('metric-bacenta-giving')).toHaveTextContent('GHS 50.00');
  });

  it('shows a coming-soon stub for a role with no built dashboard yet', () => {
    mockUseAuth.mockReturnValue(actorWithRole('WORKER'));

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Dashboard — coming soon for this role')).toBeInTheDocument();
  });

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` Objective 1 routing -
   * one smoke test per newly-wired role, each asserting a static,
   * always-rendered heading from that persona's own dashboard file (not
   * gated behind a specific fetch shape), the same "assert the shell
   * renders, not every data path" scope the existing tests above already
   * establish for Resident Pastor/Bacenta Leader.
   */
  it('renders the Ministry Leader dashboard for BASONTA_LEADER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BASONTA_LEADER', { basontaId: 'basonta-1' }));
    // `[Post-Milestone D — Portal Experiences follow-up]` `useGroupActivity`
    // needs the real `GroupActivityResponseDto` shape, not the generic `[]`
    // every other fetch in this test still returns - `buildActivityFeed`
    // reads `.membershipChanges`/`.staffingTargetChanges`/`.gatherings` off
    // it directly, which would throw on a bare array.
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/ministry/groups/basonta-1/activity')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ from: '2026-07-21T00:00:00.000Z', to: '2026-08-20T00:00:00.000Z', membershipChanges: [], staffingTargetChanges: [], gatherings: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Staffing targets')).toBeInTheDocument());
  });

  it('renders the Branch Treasurer dashboard for TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/giving-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            from: '2026-08-16T00:00:00.000Z',
            to: '2026-08-23T00:00:00.000Z',
            buckets: [
              {
                bucketStart: '2026-08-16T00:00:00.000Z',
                bucketEnd: '2026-08-23T00:00:00.000Z',
                label: '2026-08-16',
                totalAmountMinor: '10000',
                byType: { OFFERING: '6000', TITHE: '4000' },
              },
            ],
            unattributedAmountMinor: '0',
            unmappedGatheringTypes: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Giving Breakdown')).toBeInTheDocument());
  });

  /**
   * `[Milestone D — Portal Experiences]` Proves each of the six real
   * giving-breakdown numbers is sourced from its own distinct
   * `gatheringCategory` fetch (Branch Tithes/Offerings, Previous Sunday
   * Offering/Tithe, Midweek Offering/Tithe, Bacenta Giving, Basonta
   * Giving) rather than one shared/fabricated value repeated across
   * cards - each mocked response below returns a different amount, and
   * every one must appear on its own card. Also proves the retired
   * demo-data sections (Monthly trends, Financial alerts,
   * `SampleDataBadge`) are gone.
   */
  it('renders six distinct real giving numbers for TREASURER, sourced from their own gatheringCategory - never fabricated or duplicated', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));

    function bucket(totalAmountMinor: string, offeringMinor: string, titheMinor: string) {
      return {
        branchId: 'branch-1',
        from: '2026-08-16T00:00:00.000Z',
        to: '2026-08-23T00:00:00.000Z',
        buckets: [
          {
            bucketStart: '2026-08-16T00:00:00.000Z',
            bucketEnd: '2026-08-23T00:00:00.000Z',
            label: '2026-08-16',
            totalAmountMinor,
            byType: { OFFERING: offeringMinor, TITHE: titheMinor },
          },
        ],
        unattributedAmountMinor: '0',
        unmappedGatheringTypes: [],
      };
    }

    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('gatheringCategory=SUNDAY')) return Promise.resolve({ ok: true, json: async () => bucket('300000', '111100', '188900') });
      if (url.includes('gatheringCategory=MIDWEEK')) return Promise.resolve({ ok: true, json: async () => bucket('40000', '222200', '177800') });
      if (url.includes('gatheringCategory=BACENTA_MEETING')) return Promise.resolve({ ok: true, json: async () => bucket('333300', '0', '0') });
      if (url.includes('gatheringCategory=BASONTA_MEETING')) return Promise.resolve({ ok: true, json: async () => bucket('444400', '0', '0') });
      if (url.includes('/insights/giving-trend')) return Promise.resolve({ ok: true, json: async () => bucket('555500', '600000', '700000') });
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('giving-breakdown-grid')).toBeInTheDocument());

    expect(within(screen.getByTestId('metric-branch-tithes')).getByText('GHS 7,000.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-branch-offerings')).getByText('GHS 6,000.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-sunday-offering')).getByText('GHS 1,111.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-sunday-tithe')).getByText('GHS 1,889.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-midweek-offering')).getByText('GHS 2,222.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-midweek-tithe')).getByText('GHS 1,778.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-bacenta-giving')).getByText('GHS 3,333.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-basonta-giving')).getByText('GHS 4,444.00')).toBeInTheDocument();

    // The retired demo-data sections must be gone entirely.
    expect(screen.queryByText('Monthly trends')).not.toBeInTheDocument();
    expect(screen.queryByText('Financial alerts')).not.toBeInTheDocument();
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument();
  });

  it('shows a real ErrorState with retry, never fabricated numbers, when the giving breakdown fails to load for TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/giving-trend')) return Promise.resolve({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Couldn't load the giving breakdown")).toBeInTheDocument());
    expect(screen.queryByTestId('giving-breakdown-grid')).not.toBeInTheDocument();
  });

  it('renders the Branch Pastor dashboard for ASSISTANT_PASTOR with no cluster assigned', () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('No Bacentas assigned')).toBeInTheDocument();
  });

  /**
   * `[Branch Pastor Dashboard sprint]` The hero Bacenta Performance table
   * against a realistic single-Bacenta cluster fixture - real Members
   * (`GET /people?groupId=`), real Sunday attendance (the Branch-wide
   * Sunday Service Gathering + its attendance-records, cross-referenced
   * against this Bacenta's own roster), real Bacenta Meeting attendance
   * (this Bacenta's own CELL_MEETING Gathering + attendance-records), and
   * real Bacenta Meeting Offering (`GET
   * /bank-deposit-confirmations/reconciliation`). Every one of these
   * endpoints is real and already authorized - two of them
   * (`gatherings.gathering.read` widened to BRANCH,
   * `gatherings.attendance.read` newly granted) only became reachable for
   * `ASSISTANT_PASTOR` via this sprint's own `permission-matrix.ts` fix,
   * which is exactly why no prior test exercised this path with a
   * realistic fetch mock at all.
   */
  it('renders real Bacenta-by-Bacenta performance data (not fabricated) for ASSISTANT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/groups/bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'bacenta-1',
            branchId: 'branch-1',
            type: 'PASTORAL_CARE',
            name: 'Grace Bacenta',
            meetingSchedule: null,
            meetingLocation: null,
            category: null,
            lifecycleStatus: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        });
      }
      if (url.includes('/people?groupId=bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'person-a', branchId: 'branch-1', firstName: 'A', lastName: 'One', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'MEMBER', guardianPersonId: null, createdAt: '', updatedAt: '' },
            { id: 'person-b', branchId: 'branch-1', firstName: 'B', lastName: 'Two', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'MEMBER', guardianPersonId: null, createdAt: '', updatedAt: '' },
          ],
        });
      }
      if (url.includes('/gatherings/gathering-sunday/attendance-records')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'ar-1', gatheringId: 'gathering-sunday', personId: 'person-a', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'x', recordedAt: new Date().toISOString() }],
        });
      }
      if (url.includes('/gatherings/gathering-meeting/attendance-records')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'ar-2', gatheringId: 'gathering-meeting', personId: 'person-a', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'x', recordedAt: new Date().toISOString() }],
        });
      }
      if (url.includes('/gatherings?type=SUNDAY_SERVICE')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'gathering-sunday', branchId: 'branch-1', ownerGroupId: null, seriesId: null, type: 'SUNDAY_SERVICE', scheduledStart: new Date().toISOString(), scheduledEnd: null, venue: null, status: 'COMPLETED', config: null, createdByPersonId: 'x', createdAt: '', updatedAt: '' }],
        });
      }
      if (url.includes('/gatherings?ownerGroupId=bacenta-1&type=CELL_MEETING')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'gathering-meeting', branchId: 'branch-1', ownerGroupId: 'bacenta-1', seriesId: null, type: 'CELL_MEETING', scheduledStart: new Date().toISOString(), scheduledEnd: null, venue: null, status: 'COMPLETED', config: null, createdByPersonId: 'x', createdAt: '', updatedAt: '' }],
        });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [{ groupId: 'bacenta-1', verifiedTotalMinor: '25000', depositedAmountMinor: null, bankReference: null, matched: false }] }),
        });
      }
      if (url.includes('/insights/cluster-dashboard/')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', groupId: 'bacenta-1', pulseScore: undefined, alerts: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('bacenta-performance-table')).toBeInTheDocument());
    const table = within(screen.getByTestId('bacenta-performance-table'));
    expect(table.getByText('Grace Bacenta')).toBeInTheDocument();
    // 2 real members, 1 real Sunday PRESENT record, 1 real Meeting PRESENT record, real GHS 250.00 offering - none fabricated.
    expect(table.getByText('2')).toBeInTheDocument();
    expect(table.getByText('GHS 250.00')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('branch-health-statement')).toBeInTheDocument());
    const health = within(screen.getByTestId('branch-health-statement'));
    expect(health.getByText('1')).toBeInTheDocument();
    expect(health.getByText('2 Members')).toBeInTheDocument();
  });

  /**
   * `[Milestone D — Portal Experiences, Portal 2: Branch Administrator]`
   * Renamed from `SuperAdministratorDashboard` - see that component's own
   * (now `BranchAdministratorDashboard.tsx`) doc comment. `useBranchDashboard`
   * (`GET /insights/branch-dashboard`) needs a real `{ pulseScore, alerts }`
   * shape - `alerts.filter(...)` would otherwise crash on a bare `[]` the
   * way every other list endpoint this test also hits is fine with.
   * `useAdminDashboardData` needs its own real `membership-trend`/
   * `attendance-trend` shapes too, or its own `.snapshot`/`.buckets[0]`
   * reads crash the same way.
   */
  it('renders the Branch Administrator dashboard for ADMIN, with real membership/attendance metrics', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.includes('/insights/branch-dashboard')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', pulseScore: undefined, alerts: [] }) });
      }
      if (url.includes('/insights/membership-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            from: '2026-01-01T00:00:00.000Z',
            to: '2026-08-01T00:00:00.000Z',
            registeredPeopleSeries: [],
            membersSeries: [],
            snapshot: {
              registeredPeopleCount: 500,
              membersCount: 420,
              activeMembersCount: 300,
              inactiveMembersCount: 120,
              activeMemberWindowWeeks: 8,
              firstTimersCount: 5,
              visitorsCount: 10,
              peopleWithoutBacentaCount: 15,
              bacentaMembershipCount: 400,
              basontaMembershipCount: 150,
            },
          }),
        });
      }
      if (url.includes('/insights/attendance-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            from: '2026-08-16T00:00:00.000Z',
            to: '2026-08-23T00:00:00.000Z',
            buckets: [{ bucketStart: '2026-08-16T00:00:00.000Z', bucketEnd: '2026-08-23T00:00:00.000Z', label: '2026-08-16', presentCount: 42 }],
            byGroup: [],
            unmappedGatheringTypes: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('admin-metrics-grid')).toBeInTheDocument());
    expect(screen.getByTestId('metric-registered-members')).toHaveTextContent('500');
    expect(screen.getByTestId('metric-active-members')).toHaveTextContent('300');
    expect(screen.getByTestId('metric-inactive-members')).toHaveTextContent('120');
    expect(screen.getByTestId('metric-sunday-attendance')).toHaveTextContent('42');
    expect(screen.getByTestId('metric-bacenta-attendance')).toHaveTextContent('42');
    expect(screen.getByTestId('metric-basonta-attendance')).toHaveTextContent('42');
    expect(screen.queryByText('Multi-Branch overview')).not.toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 7: Council]`
   * `COUNCIL_OVERSEER`/`COUNCIL_TREASURER` previously fell to the generic
   * "coming soon" stub - now render `CouncilDashboard`, real
   * `council=true` trend data, one real Branch-card per Branch in the
   * actor's own Council (one, in this deployment). */
  it('renders the real Council dashboard for COUNCIL_OVERSEER, including Attendance/Membership this role holds', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_OVERSEER', { branchName: 'Headquarters' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/giving-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [{ label: 'Week', totalAmountMinor: '5000', byType: {} }], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }] }),
        });
      }
      if (url.includes('/insights/attendance-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [{ label: 'Week', presentCount: 12 }], byGroup: [], unmappedGatheringTypes: [] }] }),
        });
      }
      if (url.includes('/insights/membership-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            councilBranches: [
              {
                branchId: 'branch-1',
                from: '',
                to: '',
                registeredPeopleSeries: [],
                membersSeries: [],
                snapshot: {
                  registeredPeopleCount: 200,
                  membersCount: 150,
                  activeMembersCount: 90,
                  inactiveMembersCount: 60,
                  activeMemberWindowWeeks: 8,
                  firstTimersCount: 0,
                  visitorsCount: 0,
                  peopleWithoutBacentaCount: 0,
                  bacentaMembershipCount: 0,
                  basontaMembershipCount: 0,
                },
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('council-branch-card')).toBeInTheDocument());
    expect(screen.getByText('Headquarters')).toBeInTheDocument();
    expect(screen.getByTestId('metric-council-giving')).toHaveTextContent('GHS 50.00');
    expect(screen.getByTestId('metric-council-attendance')).toHaveTextContent('12');
    expect(screen.getByTestId('metric-council-members')).toHaveTextContent('200');
  });

  it('renders only Giving for COUNCIL_TREASURER, the one grant this role holds - no Attendance/Membership cards', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('COUNCIL_TREASURER', { branchName: 'Headquarters' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/giving-trend')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ councilBranches: [{ branchId: 'branch-1', from: '', to: '', buckets: [{ label: 'Week', totalAmountMinor: '3000', byType: {} }], unattributedAmountMinor: '0', unmappedGatheringTypes: [] }] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('metric-council-giving')).toHaveTextContent('GHS 30.00'));
    expect(screen.queryByTestId('metric-council-attendance')).not.toBeInTheDocument();
    expect(screen.queryByTestId('metric-council-members')).not.toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 8: System Administrator]`
   * Previously fell to the generic "coming soon" stub, then an honest
   * disclosed-gap state (no Tenant backend existed yet).
   * `[Post-Milestone D — Portal Experiences follow-up]` Now real: the
   * Tenant list renders from `GET /platform/tenants`. */
  it('renders the real Tenant list for SYSTEM_ADMINISTRATOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('SYSTEM_ADMINISTRATOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/platform/tenants')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'tenant-1', name: 'River of Life', createdAt: '2026-08-01T00:00:00.000Z' }],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('River of Life')).toBeInTheDocument());
  });
});
