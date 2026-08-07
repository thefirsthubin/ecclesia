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
  it('renders the same Branch dashboard as /dashboard for RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => branchDashboard() });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
    // ResidentPastorDashboard's full read+resolve experience, not a
    // stripped-down copy.
    expect(screen.getByTestId('priority-card')).toBeInTheDocument();
  });

  it('renders the same view for ACTING_RESIDENT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ACTING_RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => branchDashboard() });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
  });

  it('renders a read-only Branch view for ADMIN, with no Resolve action', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        branchId: 'branch-1',
        pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 80, computedAt: new Date().toISOString() },
        alerts: [
          {
            id: 'alert-1',
            branchId: 'branch-1',
            scopeType: 'BRANCH',
            scopeId: 'branch-1',
            alertType: 'PULSE_DECLINE',
            message: 'Branch Church Pulse declined',
            status: 'OPEN',
            resolvedByPersonId: null,
            resolvedAt: null,
            triggeredAt: new Date().toISOString(),
          },
        ],
      }),
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Branch Church Pulse declined')).toBeInTheDocument());
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Resolve alert/ })).not.toBeInTheDocument();
  });

  it('renders the cluster drill-down for ASSISTANT_PASTOR', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/groups/')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Bacenta One' }) });
      return Promise.resolve({
        ok: true,
        json: async () => ({
          branchId: 'branch-1',
          groupId: 'bacenta-1',
          pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 50, computedAt: new Date().toISOString() },
          alerts: [],
        }),
      });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Church Pulse — Bacenta One')).toBeInTheDocument());
  });

  it('points a Bacenta Leader to the mobile app instead of a web view', () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER'));

    renderPage();

    expect(screen.getByText('Your Bacenta pulse view lives on mobile')).toBeInTheDocument();
  });

  it('points a Basonta Leader to the mobile app too', () => {
    mockUseAuth.mockReturnValue(actorWithRole('BASONTA_LEADER'));

    renderPage();

    expect(screen.getByText('Your Bacenta pulse view lives on mobile')).toBeInTheDocument();
  });

  it('shows a not-available message for a role with no Insights scope', () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));

    renderPage();

    expect(screen.getByText('Insights — not available for this role')).toBeInTheDocument();
  });
});
