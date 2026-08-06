import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { ClusterInsightsView } from './ClusterInsightsView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithClusterBacentaIds(clusterBacentaIds: string[]) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role: 'ASSISTANT_PASTOR', branchId: 'branch-1', clusterBacentaIds },
    },
  };
}

function groupDashboard(groupId: string, overrides: Record<string, unknown> = {}) {
  return {
    branchId: 'branch-1',
    groupId,
    pulseScore: { id: 'p1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: groupId, score: 55, computedAt: new Date().toISOString() },
    alerts: [],
    ...overrides,
  };
}

afterEach(() => jest.clearAllMocks());

describe('ClusterInsightsView', () => {
  it('defaults to the first Bacenta in the cluster and fetches its dashboard', async () => {
    mockUseAuth.mockReturnValue(actorWithClusterBacentaIds(['bacenta-1', 'bacenta-2']));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/groups/')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Bacenta One' }) });
      }
      if (url.includes('/insights/cluster-dashboard/bacenta-1')) {
        return Promise.resolve({ ok: true, json: async () => groupDashboard('bacenta-1') });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    render(
      <ThemeProvider>
        <ClusterInsightsView />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('church-pulse-card')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Church Pulse — Bacenta One')).toBeInTheDocument());
  });

  it('re-fetches the cluster dashboard for a different Bacenta when its chip is clicked', async () => {
    mockUseAuth.mockReturnValue(actorWithClusterBacentaIds(['bacenta-1', 'bacenta-2']));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/groups/bacenta-1')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Bacenta One' }) });
      if (url.includes('/groups/bacenta-2')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-2', name: 'Bacenta Two' }) });
      if (url.includes('/insights/cluster-dashboard/bacenta-1')) return Promise.resolve({ ok: true, json: async () => groupDashboard('bacenta-1') });
      if (url.includes('/insights/cluster-dashboard/bacenta-2')) return Promise.resolve({ ok: true, json: async () => groupDashboard('bacenta-2') });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    render(
      <ThemeProvider>
        <ClusterInsightsView />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('Church Pulse — Bacenta One')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Bacenta Two'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/v1/insights/cluster-dashboard/bacenta-2', expect.anything()),
    );
    await waitFor(() => expect(screen.getByText('Church Pulse — Bacenta Two')).toBeInTheDocument());
  });

  it('shows an error state when the Assistant Pastor has no clusterBacentaIds configured', () => {
    mockUseAuth.mockReturnValue(actorWithClusterBacentaIds([]));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });

    render(
      <ThemeProvider>
        <ClusterInsightsView />
      </ThemeProvider>,
    );

    expect(screen.getByText("Couldn't load Church Pulse")).toBeInTheDocument();
  });
});
