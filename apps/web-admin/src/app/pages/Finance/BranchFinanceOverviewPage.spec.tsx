import { render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { BranchFinanceOverviewPage } from './BranchFinanceOverviewPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'person-1', role, branchId: 'branch-1', branchName: 'Headquarters', ...extra },
    },
  };
}

function reconciliationRow(overrides: Record<string, unknown> = {}) {
  return {
    groupId: 'group-1',
    verifiedTotalMinor: '50000',
    depositedAmountMinor: null,
    bankReference: null,
    matched: false,
    ...overrides,
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
      attendance: [{ label: 'Mar', value: 0 }],
      membership: [{ label: 'Mar', value: 0 }],
      giving: [
        { label: 'Mar', value: 0 },
        { label: 'Apr', value: 0 },
        { label: 'Aug', value: 52400 },
      ],
    },
    volunteersCount: 15,
    volunteersTrend: 15,
    bacentaLeaderboard: [],
    engagementTrend: { direction: 'flat', deltaPoints: 0, windowDays: 21 },
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <BranchFinanceOverviewPage />
      </ToastProvider>
    </ThemeProvider>,
  );
}

/**
 * `[Branch Pastor portal, Finance completion]` Locks in the properties
 * the brief's own "Finance, NOT the Treasurer portal" decision depends
 * on: (1) the real whole-Branch Total Giving figure and its 6-month
 * trend render, sourced from the one endpoint `ASSISTANT_PASTOR`'s
 * `insights.branch_dashboard.read` grant genuinely reaches at BRANCH
 * scope (confirmed live against the running API this pass - see
 * `BranchFinanceOverviewPage.tsx`'s own doc comment); (2) the Bacenta
 * breakdown still renders from the reconciliation endpoint; and (3) not
 * one Treasurer-only operational control is reachable from this page -
 * asserted by name, not merely "no buttons at all."
 */
describe('BranchFinanceOverviewPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('renders the real whole-Branch Total Giving figure and its trend from the branch dashboard summary', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary({ givingTotalMinor: '52400', givingTrend: 12 }) });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(within(screen.getByTestId('branch-finance-total-card')).getByText('GHS 524.00')).toBeInTheDocument());
    expect(within(screen.getByTestId('branch-finance-total-card')).getByText(/\+12% vs\. last month/)).toBeInTheDocument();
  });

  it('renders the real 6-month Giving Trend chart from the branch dashboard summary', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({
          ok: true,
          json: async () =>
            branchDashboardSummary({
              growthSeries: {
                attendance: [],
                membership: [],
                giving: [
                  { label: 'Mar', value: 0 },
                  { label: 'Apr', value: 10000 },
                  { label: 'Aug', value: 52400 },
                ],
              },
            }),
        });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-trend-chart')).toBeInTheDocument());
    const chart = within(screen.getByTestId('branch-finance-trend-chart'));
    expect(chart.getByText('Mar')).toBeInTheDocument();
    expect(chart.getByText('Aug')).toBeInTheDocument();
    expect(chart.getByText('GHS 524')).toBeInTheDocument();
  });

  it('fetches the current week\'s reconciliation and renders the per-Bacenta breakdown', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1', 'bacenta-2'] }));
    const fetchMock = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            weekStartDate: '2026-01-05',
            rows: [
              reconciliationRow({ groupId: 'bacenta-1', verifiedTotalMinor: '50000', matched: false, depositedAmountMinor: null }),
              reconciliationRow({ groupId: 'bacenta-2', verifiedTotalMinor: '30000', matched: true, depositedAmountMinor: '30000', bankReference: 'SLIP-1' }),
            ],
          }),
        });
      }
      if (url.includes('/groups/bacenta-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
      }
      if (url.includes('/groups/bacenta-2')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-2', name: 'Faith Bacenta', type: 'PASTORAL_CARE' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/bank-deposit-confirmations/reconciliation'), expect.anything()));
    await waitFor(() => expect(screen.getByTestId('branch-finance-breakdown-table')).toBeInTheDocument());

    const table = within(screen.getByTestId('branch-finance-breakdown-table'));
    await waitFor(() => expect(table.getByText('Grace Bacenta')).toBeInTheDocument());
    expect(table.getByText('Faith Bacenta')).toBeInTheDocument();
    expect(table.getByText('GHS 500.00')).toBeInTheDocument();
    expect(table.getByText('GHS 300.00')).toBeInTheDocument();
    expect(table.getByText('Not yet deposited')).toBeInTheDocument();
    expect(table.getByText('Deposited & matched')).toBeInTheDocument();

    // Bacenta-only subtotal (500 + 300), distinct from and never equated
    // with the whole-Branch Total Giving figure above.
    expect(screen.getByText('Bacenta total this week: GHS 800.00')).toBeInTheDocument();
  });

  it('discloses its scope honestly rather than fabricating type- or gathering-differentiated giving figures', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-scope-note')).toBeInTheDocument());
    const note = screen.getByTestId('branch-finance-scope-note');
    expect(note).toHaveTextContent(/not yet broken out by type/i);
    expect(note).toHaveTextContent(/Sunday Service giving cannot currently be distinguished/i);
  });

  it('shows an empty state, not a fabricated zero, when no Bacenta has a verified figure yet', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getAllByText('No verified giving recorded yet').length).toBeGreaterThan(0));
  });

  it('shows a retryable error state when the Total Giving request fails, independently of the Bacenta breakdown', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.reject(new Error('network unavailable in test'));
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Total Giving")).toBeInTheDocument());
  });

  it('shows a retryable error state when the reconciliation request fails, independently of Total Giving', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.reject(new Error('network unavailable in test'));
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Branch giving totals")).toBeInTheDocument());
  });

  it('exposes zero Treasurer-only operational controls - no mutation action is reachable from this page', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR', { clusterBacentaIds: ['bacenta-1'] }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/insights/branch-dashboard-summary')) {
        return Promise.resolve({ ok: true, json: async () => branchDashboardSummary() });
      }
      if (url.includes('/bank-deposit-confirmations/reconciliation')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            branchId: 'branch-1',
            weekStartDate: '2026-01-05',
            rows: [reconciliationRow({ groupId: 'bacenta-1' })],
          }),
        });
      }
      if (url.includes('/groups/bacenta-1')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'bacenta-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());

    const TREASURER_ONLY_CONTROL_NAMES = [
      /verify/i,
      /flag/i,
      /escalate/i,
      /reconcile/i,
      /approve/i,
      /reject/i,
      /^pay$/i,
      /confirm deposit/i,
      /record transaction/i,
      /request expense/i,
    ];
    const buttons = screen.queryAllByRole('button');
    for (const pattern of TREASURER_ONLY_CONTROL_NAMES) {
      expect(buttons.some((button) => pattern.test(button.textContent ?? ''))).toBe(false);
    }
    expect(screen.queryAllByRole('form')).toHaveLength(0);
  });
});
