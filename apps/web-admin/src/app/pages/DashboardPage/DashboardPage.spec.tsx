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
  it('renders the Resident Pastor dashboard for RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        branchId: 'branch-1',
        pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 74, computedAt: new Date().toISOString() },
        alerts: [],
      }),
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
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

  it('renders the Council Administrator dashboard for ADMIN', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    // `useBranchDashboard` (`GET /insights/branch-dashboard`) needs a real
    // `{ pulseScore, alerts }` shape - `openAlertCount`/`alerts.filter(...)`
    // in `CouncilAdministratorDashboard` would otherwise crash on a bare
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
