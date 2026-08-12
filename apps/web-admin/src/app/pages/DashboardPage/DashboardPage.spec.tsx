import type { ReactElement } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('points a Bacenta Leader to the mobile app instead of a broken web dashboard', () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER'));

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText('Your Bacenta dashboard lives on mobile')).toBeInTheDocument();
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
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Staffing targets')).toBeInTheDocument());
  });

  it('renders the Finance Officer dashboard for TREASURER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Offering summary')).toBeInTheDocument());
  });

  it('renders the Branch Pastor dashboard for ASSISTANT_PASTOR with no cluster assigned', () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Couldn't load Church Pulse")).toBeInTheDocument();
  });

  /**
   * `[Cross-Persona Dashboards verification]` A real cluster-Bacenta
   * fixture live-tested against `nx serve api` this pass showed that
   * `GET /groups?type=MINISTRY` structurally 403s for every
   * `ASSISTANT_PASTOR`, regardless of their cluster - `GroupListResourceContextGuard`'s
   * own doc comment already discloses why ("an ASSISTANT_PASTOR's CLUSTER
   * scope cannot match a bare `{ branchId }` resource at all... this route
   * correctly denies them"). `BranchPastorDashboard.tsx`'s own doc comment
   * claims this card is "real, live data" - contradicted by that guard's
   * own documented behavior. No prior test exercised an in-cluster
   * `ASSISTANT_PASTOR` against a realistic fetch mock at all, which is
   * exactly why this went uncaught. Not fixed here (RBAC/resource-context
   * semantics change, a product decision - see
   * `RELEASE_1_WORKFLOW_MATRIX.md`'s Cross-Persona Dashboards entry) -
   * this test only pins the current, confirmed-live behavior so a future
   * change to either side is a deliberate, visible diff, not a silent one.
   */
  it('shows a real error (not fabricated data) for the Ministries card - GET /groups?type=MINISTRY structurally 403s for every ASSISTANT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/groups?type=MINISTRY')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ message: "Resource is outside the actor's CLUSTER scope for 'people.group.read'" }),
        });
      }
      if (url.includes('/insights/cluster-dashboard/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ branchId: 'branch-1', groupId: 'bacenta-1', pulseScore: undefined, alerts: [] }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText("Couldn't load Ministries")).toBeInTheDocument());
  });

  it('renders the Super Administrator dashboard for ADMIN', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    // `useBranchDashboard` (`GET /insights/branch-dashboard`) needs a real
    // `{ pulseScore, alerts }` shape - `openAlertCount`/`alerts.filter(...)`
    // in `SuperAdministratorDashboard` would otherwise crash on a bare
    // `[]` the way every other list endpoint this test also hits is fine
    // with. Every other call (`/people`, `/groups?type=MINISTRY`, `/people/:id`)
    // tolerates the generic `[]` fallback.
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', pulseScore: undefined, alerts: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByText('Multi-Branch overview')).toBeInTheDocument());
  });
});
