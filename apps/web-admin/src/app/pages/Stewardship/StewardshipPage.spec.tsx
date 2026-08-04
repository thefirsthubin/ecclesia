import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { StewardshipPage } from './StewardshipPage';

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

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ft-1',
    branchId: 'branch-1',
    type: 'OFFERING',
    sourceGroupId: null,
    giverPersonId: null,
    channel: 'CASH',
    amountMinor: '20000',
    currency: 'GHS',
    currentState: 'RECORDED',
    recordedByPersonId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function expense(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exp-1',
    branchId: 'branch-1',
    transactionId: 'ft-2',
    requestedByPersonId: 'person-2',
    description: 'Sound system repair',
    category: null,
    receiptStorageKey: null,
    approvedByPersonId: null,
    approvedAt: null,
    amountMinor: '15000',
    currency: 'GHS',
    currentState: 'REQUESTED',
    createdAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-01-01T00:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <StewardshipPage />
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('StewardshipPage', () => {
  it('renders both the Financial Transaction queue and the Expense queue', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => [transaction()] });
      }
      if (url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => [expense()] });
      }
      if (url.includes('/people/')) {
        return Promise.resolve({ ok: true, json: async () => ({ id: 'person-2', firstName: 'Ama', lastName: 'Boateng' }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('transaction-queue-card')).toBeInTheDocument());
    expect(screen.getByText('OFFERING')).toBeInTheDocument();
    expect(screen.getByText(/GHS 200\.00/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByTestId('expense-queue-card')).toBeInTheDocument());
    expect(screen.getByText('Sound system repair')).toBeInTheDocument();
    expect(screen.getByText(/GHS 150\.00/)).toBeInTheDocument();
  });

  it('shows Verify and Flag for a RECORDED transaction, and calls verify on click', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => transaction({ currentState: 'VERIFIED' }) });
      }
      if (url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => [transaction()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Verify transaction ft-1/ })).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('button', { name: /Flag transaction ft-1/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Verify transaction ft-1/ }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/financial-transactions/ft-1/verify'), expect.objectContaining({ method: 'POST' })),
    );
  });

  it('reveals a reason field when Flag is clicked, and submits it', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => transaction({ currentState: 'FLAGGED' }) });
      }
      if (url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => [transaction()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Flag transaction ft-1/ })).toBeInTheDocument(), { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: /Flag transaction ft-1/ }));

    const reasonInput = await screen.findByLabelText('Reason');
    fireEvent.change(reasonInput, { target: { value: 'Amount mismatch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit flag' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/financial-transactions/ft-1/flag'),
        expect.objectContaining({ method: 'POST', body: JSON.stringify({ reason: 'Amount mismatch' }) }),
      ),
    );
  });

  it('shows Approve and Reject for a REQUESTED expense', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => [expense()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Approve expense exp-1/ })).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('button', { name: /Reject expense exp-1/ })).toBeInTheDocument();
  });

  it('shows Pay for an APPROVED expense instead of Approve/Reject', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => [expense({ currentState: 'APPROVED' })] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    await waitFor(() => expect(screen.getByRole('button', { name: /Pay expense exp-1/ })).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.queryByRole('button', { name: /Approve expense exp-1/ })).not.toBeInTheDocument();
  });

  it('filters the transaction queue by state via the filter chips', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'VERIFIED' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/financial-transactions?state=VERIFIED'), expect.anything()),
    );
  });

  it('shows empty states when both queues are empty', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Financial Transactions')).toBeInTheDocument());
    expect(screen.getByText('No Expenses')).toBeInTheDocument();
  });

  it('shows retryable error states when a queue request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Financial Transactions")).toBeInTheDocument());
    expect(screen.getByText("Couldn't load Expenses")).toBeInTheDocument();
  });

  it('reveals the Record Transaction form, and for a TREASURER submits with no sourceGroupId', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => transaction({ id: 'ft-new' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('No Financial Transactions')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Record a new Financial Transaction' }));

    expect(screen.getByTestId('record-transaction-form')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('record-transaction-amount'), { target: { value: '50' } });
    fireEvent.click(screen.getByTestId('record-transaction-submit'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/financial-transactions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'OFFERING', sourceGroupId: undefined, channel: 'CASH', amountMinor: '5000' }),
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByTestId('record-transaction-form')).not.toBeInTheDocument());
  });

  it('for a BACENTA_LEADER, Record Transaction sends sourceGroupId from the actor\'s own bacentaId', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => transaction({ id: 'ft-new', sourceGroupId: 'bacenta-1' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('No Financial Transactions')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Record a new Financial Transaction' }));
    fireEvent.change(screen.getByTestId('record-transaction-amount'), { target: { value: '25' } });
    fireEvent.click(screen.getByTestId('record-transaction-submit'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/financial-transactions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'OFFERING', sourceGroupId: 'bacenta-1', channel: 'CASH', amountMinor: '2500' }),
        }),
      ),
    );
  });

  it('Record Transaction submit stays disabled for an invalid amount', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Financial Transactions')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Record a new Financial Transaction' }));
    fireEvent.change(screen.getByTestId('record-transaction-amount'), { target: { value: '0' } });

    expect(screen.getByText('Enter a valid amount greater than 0')).toBeInTheDocument();
    expect(screen.getByTestId('record-transaction-submit')).toBeDisabled();
  });

  it('Cancel on the Record Transaction form hides it without submitting anything', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('No Financial Transactions')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Record a new Financial Transaction' }));
    fireEvent.change(screen.getByTestId('record-transaction-amount'), { target: { value: '50' } });
    fetchMock.mockClear();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByTestId('record-transaction-form')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/financial-transactions'), expect.objectContaining({ method: 'POST' }));
  });

  it('reveals the Request Expense form and submits amount/description/category', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => expense({ id: 'exp-new' }) });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('No Expenses')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Request a new Expense' }));

    fireEvent.change(screen.getByTestId('request-expense-amount'), { target: { value: '150' } });
    fireEvent.change(screen.getByTestId('request-expense-description'), { target: { value: 'Sound system repair' } });
    fireEvent.change(screen.getByTestId('request-expense-category'), { target: { value: 'Facilities' } });
    fireEvent.click(screen.getByTestId('request-expense-submit'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/expenses'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ amountMinor: '15000', description: 'Sound system repair', category: 'Facilities' }),
        }),
      ),
    );
    await waitFor(() => expect(screen.queryByTestId('request-expense-form')).not.toBeInTheDocument());
  });

  it('Request Expense submit stays disabled until amount and description are both filled', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Expenses')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Request a new Expense' }));

    expect(screen.getByTestId('request-expense-submit')).toBeDisabled();
    fireEvent.change(screen.getByTestId('request-expense-amount'), { target: { value: '150' } });
    expect(screen.getByTestId('request-expense-submit')).toBeDisabled();
    fireEvent.change(screen.getByTestId('request-expense-description'), { target: { value: 'Sound system repair' } });
    expect(screen.getByTestId('request-expense-submit')).not.toBeDisabled();
  });
});
