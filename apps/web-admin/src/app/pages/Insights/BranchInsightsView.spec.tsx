import { render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { BranchInsightsView } from './BranchInsightsView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'ap-1', role, branchId: 'branch-1', branchName: 'Headquarters', ...extra },
    },
  };
}

function branchDashboardSummary(overrides: Record<string, unknown> = {}) {
  return {
    branchId: 'branch-1',
    membersCount: 60,
    membersTrend: 5,
    attendanceTotal: 35,
    attendanceTrend: 0,
    givingTotalMinor: '52400',
    givingTrend: 12,
    growthSeries: {
      attendance: [{ label: 'Jul', value: 30 }, { label: 'Aug', value: 35 }],
      membership: [{ label: 'Jul', value: 55 }, { label: 'Aug', value: 60 }],
      giving: [{ label: 'Jul', value: 40000 }, { label: 'Aug', value: 52400 }],
    },
    volunteersCount: 15,
    volunteersTrend: 15,
    bacentaLeaderboard: [],
    engagementTrend: { direction: 'flat', deltaPoints: 0, windowDays: 21 },
    ...overrides,
  };
}

function clusterDashboard(groupId: string, score: number) {
  return {
    branchId: 'branch-1',
    groupId,
    pulseScore: { id: `p-${groupId}`, branchId: 'branch-1', scopeType: 'GROUP', scopeId: groupId, score, computedAt: new Date().toISOString() },
    alerts: [],
  };
}

function followUpTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    personId: 'person-1',
    assignedToPersonId: 'ap-1',
    status: 'OPEN',
    dueAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    escalatedAt: null,
    escalatedToPersonId: null,
    createdByPersonId: 'ap-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <BranchInsightsView />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

/**
 * `[Branch Pastor portal, Insights rebuild]` Locks in that every one of
 * the brief's own example questions this page claims to answer is backed
 * by a real fetch, not a fabricated figure - and that the one question it
 * cannot answer ("where are people becoming inactive") is disclosed, not
 * silently omitted.
 */
describe('BranchInsightsView', () => {
  function mockFetchFor(clusterBacentaIds: string[], scores: Record<string, number>, followUps: unknown[] = []) {
    return jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      const clusterMatch = clusterBacentaIds.find((id) => url.includes(`/insights/cluster-dashboard/${id}`));
      if (clusterMatch) return Promise.resolve({ ok: true, json: async () => clusterDashboard(clusterMatch, scores[clusterMatch]) });
      if (url.includes('/pastoral-care/follow-up-tasks')) return Promise.resolve({ ok: true, json: async () => followUps });
      if (url.includes('/groups/bacenta-1')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
      if (url.includes('/groups/bacenta-2')) return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-2', name: 'Faith Bacenta', type: 'PASTORAL_CARE' }) });
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  }

  it('renders the real Branch-wide attendance/giving trend from branch-dashboard-summary', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = mockFetchFor(['bacenta-1'], { 'bacenta-1': 70 });

    renderPage();

    await waitFor(() => expect(within(screen.getByTestId('insights-attendance-trend-card')).getByText('35')).toBeInTheDocument());
    // `growthSeries.giving` values are minor units on the wire - 52400 -> GHS 524.
    expect(within(screen.getByTestId('insights-giving-trend-card')).getByText('GHS 524')).toBeInTheDocument();
  });

  it('ranks every Bacenta in the cluster by real Church Pulse score, strongest first', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
    global.fetch = mockFetchFor(['bacenta-1', 'bacenta-2'], { 'bacenta-1': 40, 'bacenta-2': 85 });

    renderPage();

    await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());
    expect(screen.getByText('Faith Bacenta')).toBeInTheDocument();

    const rowsText = screen.getByTestId('insights-bacenta-health-card').textContent ?? '';
    // Faith (85) is sorted before Grace (40) - strongest first.
    expect(rowsText.indexOf('Faith Bacenta')).toBeLessThan(rowsText.indexOf('Grace Bacenta'));
  });

  it('counts a real overdue Follow-up (past due date, still OPEN) across the cluster', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = mockFetchFor(['bacenta-1'], { 'bacenta-1': 60 }, [followUpTask({ id: 'ft-overdue' })]);

    renderPage();

    await waitFor(() => expect(screen.getByText('1 overdue')).toBeInTheDocument());
  });

  it('does not count an OPEN task that is not yet due as overdue', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = mockFetchFor(['bacenta-1'], { 'bacenta-1': 60 }, [
      followUpTask({ id: 'ft-future', dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() }),
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText('Nothing is overdue across your cluster right now.')).toBeInTheDocument());
  });

  it('discloses honestly that no Branch-level inactivity/lapsing trend exists, rather than fabricating one', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = mockFetchFor(['bacenta-1'], { 'bacenta-1': 60 });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('insights-scope-note')).toBeInTheDocument());
    expect(screen.getByTestId('insights-scope-note')).toHaveTextContent(/cannot yet show which members are becoming inactive/i);
  });

  it('shows an empty state when the actor has no Bacentas assigned, not a broken page', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: [] }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

    renderPage();

    expect(screen.getByText('No Bacentas assigned')).toBeInTheDocument();
  });
});
