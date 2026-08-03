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
});
