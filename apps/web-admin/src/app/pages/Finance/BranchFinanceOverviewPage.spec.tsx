import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

function givingTrendResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    branchId: 'branch-1',
    from: '2026-08-16T00:00:00.000Z',
    to: '2026-08-23T00:00:00.000Z',
    buckets: [
      {
        bucketStart: '2026-08-16T00:00:00.000Z',
        bucketEnd: '2026-08-23T00:00:00.000Z',
        label: '2026-08-16',
        totalAmountMinor: '100000',
        byType: { OFFERING: '60000', TITHE: '40000' },
      },
    ],
    unattributedAmountMinor: '0',
    unmappedGatheringTypes: [],
    ...overrides,
  };
}

function mockFetch(overrides: { sunday?: string; midweek?: string; bacenta?: string; basonta?: string; other?: string; branch?: string; unattributed?: string } = {}) {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('gatheringCategory=SUNDAY')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.sunday ?? '100000', byType: { OFFERING: '60000', TITHE: '40000' } }] }) });
    if (url.includes('gatheringCategory=MIDWEEK')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.midweek ?? '20000' }] }) });
    if (url.includes('gatheringCategory=BACENTA_MEETING')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.bacenta ?? '80000' }] }) });
    if (url.includes('gatheringCategory=BASONTA_MEETING')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.basonta ?? '30000' }] }) });
    if (url.includes('gatheringCategory=OTHER')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.other ?? '10000' }] }) });
    if (url.includes('/insights/giving-trend')) return Promise.resolve({ ok: true, json: async () => givingTrendResult({ unattributedAmountMinor: overrides.unattributed ?? '0', buckets: [{ ...givingTrendResult().buckets[0], totalAmountMinor: overrides.branch ?? '150000' }] }) });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
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

afterEach(() => jest.clearAllMocks());

/**
 * `[Milestone D — Portal Experiences]` Rebuilt on `useGivingBreakdown` -
 * see that component's own doc comment for why the prior "no Sunday/
 * Bacenta/Basonta breakdown is possible" disclosure was stale. Locks in
 * the properties the "read-only Finance, NOT the Treasurer portal"
 * decision depends on: (1) real, distinct giving numbers per category;
 * (2) not one Treasurer-only operational control is reachable from this
 * page; (3) both real consumers (`ASSISTANT_PASTOR`, `ADMIN`) render it
 * identically.
 */
describe('[Milestone D] BranchFinanceOverviewPage', () => {
  it.each(['ASSISTANT_PASTOR', 'ADMIN'])('renders five distinct real giving numbers for %s, never fabricated or duplicated', async (role) => {
    mockUseAuth.mockReturnValue(actorWithRole(role));
    global.fetch = mockFetch({ sunday: '111100', bacenta: '222200', basonta: '333300', other: '444400' });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-breakdown-grid')).toBeInTheDocument());
    expect(within(screen.getByTestId('metric-sunday-offerings')).getByText('GHS 600.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-sunday-tithes')).getByText('GHS 400.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-bacenta-giving')).getByText('GHS 2,222.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-basonta-giving')).getByText('GHS 3,333.00')).toBeInTheDocument();
    expect(within(screen.getByTestId('metric-other-giving')).getByText('GHS 4,444.00')).toBeInTheDocument();
  });

  it('renders the real whole-Branch total for the week as the hero statement', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = mockFetch({ branch: '150000' });

    renderPage();

    await waitFor(() => expect(within(screen.getByTestId('branch-finance-total-card')).getByText('GHS 1,500.00')).toBeInTheDocument());
  });

  it('discloses unattributed giving explicitly rather than silently dropping it', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch({ unattributed: '5000' });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-unattributed-card')).toBeInTheDocument());
    expect(screen.getByTestId('branch-finance-unattributed-card')).toHaveTextContent('GHS 50.00');
  });

  it('does not render the unattributed disclosure card when there is nothing to disclose', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = mockFetch({ unattributed: '0' });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-breakdown-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('branch-finance-unattributed-card')).not.toBeInTheDocument();
  });

  it('shows a retryable ErrorState, never fabricated numbers, when the giving breakdown fails to load', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load this week's giving")).toBeInTheDocument());
    expect(screen.queryByTestId('branch-finance-breakdown-grid')).not.toBeInTheDocument();
  });

  it('exposes zero operational controls for ADMIN - no mutation action of any kind is reachable from this page', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch();

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-breakdown-grid')).toBeInTheDocument());

    const ANY_CONTROL_NAMES = [/verify/i, /flag/i, /escalate/i, /reconcile/i, /approve/i, /reject/i, /^pay$/i, /confirm deposit/i, /record transaction/i, /request expense/i];
    const buttons = screen.queryAllByRole('button');
    for (const pattern of ANY_CONTROL_NAMES) {
      expect(buttons.some((button) => pattern.test(button.textContent ?? ''))).toBe(false);
    }
    expect(screen.queryAllByTestId('expense-request-form')).toHaveLength(0);
    expect(screen.queryByTestId('branch-finance-expense-queue-card')).not.toBeInTheDocument();
  });

  /** `[Milestone D — Portal Experiences, Portal 6: Assistant Pastor]`
   * `ASSISTANT_PASTOR` genuinely holds `stewardship.expense.request`/
   * `.approve`/`.receipt`/`.read` at CLUSTER scope (traced against
   * `permission-matrix.ts`, not assumed) - "Treasurer-only" was the wrong
   * frame for this role all along. This locks in the corrected boundary:
   * real Request/Approve/Reject controls now render for this role, but
   * the genuinely Treasurer-only ones (Verify/Flag/Escalate/Reconcile/
   * Pay/Confirm Deposit/Record Transaction - none of which this role
   * holds a grant for) still never appear. */
  it('exposes the real Request/Approve/Reject expense controls for ASSISTANT_PASTOR, but none of the genuinely Treasurer-only ones', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    global.fetch = mockFetch();

    renderPage();

    await waitFor(() => expect(screen.getByTestId('branch-finance-expense-queue-card')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Request expense' })).toBeInTheDocument();

    const TREASURER_ONLY_CONTROL_NAMES = [/verify/i, /flag/i, /escalate/i, /reconcile/i, /^pay$/i, /confirm deposit/i, /record transaction/i];
    const buttons = screen.queryAllByRole('button');
    for (const pattern of TREASURER_ONLY_CONTROL_NAMES) {
      expect(buttons.some((button) => pattern.test(button.textContent ?? ''))).toBe(false);
    }
  });

  it('requests an expense via the reveal form, then refetches and shows it in the queue', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    let expenses: unknown[] = [];
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/expenses') && init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as Record<string, unknown>;
        expenses = [{ id: 'exp-new', requestedByPersonId: 'person-1', currentState: 'REQUESTED', currency: 'GHS', createdAt: new Date().toISOString(), ...body }];
        return Promise.resolve({ ok: true, json: async () => expenses[0] });
      }
      if (url.endsWith('/expenses')) return Promise.resolve({ ok: true, json: async () => expenses });
      if (url.includes('/insights/giving-trend')) return mockFetch()(url);
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();
    await waitFor(() => expect(screen.getByText('No Expenses')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Request expense' }));
    fireEvent.change(screen.getByLabelText('Amount (GHS)'), { target: { value: '75.50' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Transport for outreach' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit request' }));

    await waitFor(() => expect(screen.getByText('Transport for outreach')).toBeInTheDocument());
    expect(screen.queryByTestId('expense-request-form')).not.toBeInTheDocument();
  });

  it('approves an expense and refetches the queue', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ASSISTANT_PASTOR'));
    let currentState = 'REQUESTED';
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url.includes('/expenses/exp-1/approve') && init?.method === 'POST') {
        currentState = 'APPROVED';
        return Promise.resolve({ ok: true, json: async () => ({ id: 'exp-1', currentState }) });
      }
      if (url.endsWith('/expenses')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 'exp-1', description: 'Transport', category: null, amountMinor: '7550', currency: 'GHS', requestedByPersonId: 'person-2', currentState, createdAt: new Date().toISOString() }],
        });
      }
      if (url.includes('/people/person-2')) return Promise.resolve({ ok: true, json: async () => ({ id: 'person-2', firstName: 'Kofi', lastName: 'Mensah' }) });
      if (url.includes('/insights/giving-trend')) return mockFetch()(url);
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve expense: Transport' })).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Approve expense: Transport' }));

    await waitFor(() => expect(screen.getByText('APPROVED')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Approve expense: Transport' })).not.toBeInTheDocument();
  });
});
