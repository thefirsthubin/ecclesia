import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { DashboardPage } from './DashboardPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1' },
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

    render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    expect(screen.getByText('Church Pulse — whole Branch')).toBeInTheDocument();
  });

  it('renders the ACTING_RESIDENT_PASTOR the same Branch dashboard', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ACTING_RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>,
    );

    // Even on a failed fetch, this is the Resident Pastor dashboard shell
    // (its own ErrorState), not a role-stub.
    await waitFor(() => expect(screen.getByText("Couldn't load Church Pulse")).toBeInTheDocument());
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
  });

  it('points a Bacenta Leader to the mobile app instead of a broken web dashboard', () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER'));

    render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Your Bacenta dashboard lives on mobile')).toBeInTheDocument();
  });

  it('shows a coming-soon stub for a role with no built dashboard yet', () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));

    render(
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>,
    );

    expect(screen.getByText('Dashboard — coming soon for this role')).toBeInTheDocument();
  });
});
