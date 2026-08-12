import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

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

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Now also wraps
 * `ToastProvider` - `ReceiptUploadPanel` (rendered per Expense row) calls
 * `useToast()` unconditionally (React's rules of hooks mean it can't be
 * called only for PAID/RECEIPT_RETAINED rows), which throws outside a
 * `ToastProvider` by that hook's own design. `app.tsx` always mounts
 * `ToastProvider` at the real app root, so this just matches production
 * reality, the same way this helper already wraps `ThemeProvider`.
 */
function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <StewardshipPage />
      </ToastProvider>
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
    // `[UX Design Implementation]` Final UX Design Specification §19
    // (Phase 5 Stewardship workflow UI) - the Type column now shows the
    // same friendly label the Record Transaction form's own dropdown
    // uses ("Offering"), not the raw wire value ("OFFERING").
    expect(screen.getByText('Offering')).toBeInTheDocument();
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

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - `runTransactionAction` previously
   * had no `catch` at all, so a failed Verify (e.g. the backend's real
   * same-actor-verification-restriction 409) left the button simply no
   * longer loading, with no success or error signal whatsoever. */
  it('shows an error toast when Verify fails, instead of failing silently', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/verify')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'A Financial Transaction cannot be verified by the Person who recorded it.' }),
        });
      }
      if (url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => [transaction()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Verify transaction ft-1/ }));

    expect(await screen.findByText('A Financial Transaction cannot be verified by the Person who recorded it.')).toBeInTheDocument();
    // The row itself is untouched by a failed request - Verify is still offered.
    expect(screen.getByRole('button', { name: /Verify transaction ft-1/ })).toBeInTheDocument();
  });

  /** Same fix, the inline-error path (Flag has its own reveal form, so
   * the error surfaces there instead of a toast - mirrors
   * `submitCreate`'s own established inline-error pattern). */
  it('shows the server-provided error inline and keeps the form open when Flag fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/flag')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ message: "No Role Assignment grants 'stewardship.financial_transaction.flag' to role 'TREASURER'" }),
        });
      }
      if (url.includes('/financial-transactions')) {
        return Promise.resolve({ ok: true, json: async () => [transaction()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Flag transaction ft-1/ }));

    const reasonInput = await screen.findByLabelText('Reason');
    fireEvent.change(reasonInput, { target: { value: 'Amount mismatch' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit flag' }));

    await waitFor(() =>
      expect(screen.getByText("No Role Assignment grants 'stewardship.financial_transaction.flag' to role 'TREASURER'")).toBeInTheDocument(),
    );
    expect(screen.getByTestId('flag-form')).toBeInTheDocument();
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

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 5 Stewardship workflow UI) - same fix as Verify/Flag above,
   * applied to `runExpenseAction`. */
  it('shows an error toast when Approve fails, instead of failing silently', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/approve')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ message: "No Role Assignment grants 'stewardship.expense.approve' to role 'RESIDENT_PASTOR'" }),
        });
      }
      if (url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => [expense()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Approve expense exp-1/ }));

    expect(await screen.findByText("No Role Assignment grants 'stewardship.expense.approve' to role 'RESIDENT_PASTOR'")).toBeInTheDocument();
  });

  it('shows the server-provided error inline and keeps the form open when Reject fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/reject')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ message: 'This Expense has already been approved.' }),
        });
      }
      if (url.includes('/expenses')) {
        return Promise.resolve({ ok: true, json: async () => [expense()] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Reject expense exp-1/ }));

    const reasonInput = await screen.findByLabelText('Reason');
    fireEvent.change(reasonInput, { target: { value: 'Not budgeted' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit rejection' }));

    await waitFor(() => expect(screen.getByText('This Expense has already been approved.')).toBeInTheDocument());
    expect(screen.getByTestId('reject-form')).toBeInTheDocument();
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

  /**
   * `[Bank Deposit Confirmation milestone]` No `state.actor` role check is
   * asserted here - `confirmBankDeposit` has no client-side authorization
   * gate of its own (same reasoning as every other action this session).
   * `global.fetch` mocks below always answer `/financial-transactions`/
   * `/expenses` with `[]` too, since both queues always render regardless
   * of what this section is doing.
   */
  describe('Bank Deposit Reconciliation', () => {
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

    it('does not fetch a reconciliation until a week is chosen', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
      global.fetch = fetchMock;

      renderPage();

      await waitFor(() => expect(screen.getByText('Choose a week to view its reconciliation.')).toBeInTheDocument());
      expect(fetchMock.mock.calls.some(([url]) => (url as string).includes('/bank-deposit-confirmations'))).toBe(false);
    });

    it('fetches the reconciliation for the chosen week and renders each row with its match state', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      const fetchMock = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              branchId: 'branch-1',
              weekStartDate: '2026-01-05',
              rows: [
                reconciliationRow({ groupId: 'group-1', matched: false, depositedAmountMinor: null }),
                reconciliationRow({ groupId: 'group-2', matched: true, depositedAmountMinor: '50000', bankReference: 'SLIP-42' }),
              ],
            }),
          });
        }
        if (url.includes('/groups/')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'group-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/bank-deposit-confirmations/reconciliation?weekStartDate=2026-01-05'), expect.anything()),
      );
      await waitFor(() => expect(screen.getByTestId('reconciliation-card')).toBeInTheDocument());
      expect(screen.getByText('Not yet confirmed')).toBeInTheDocument();
      expect(screen.getByText('Matched')).toBeInTheDocument();
      expect(screen.getByText(/SLIP-42/)).toBeInTheDocument();
    });

    /** `[UX Design Implementation]` Final UX Design Specification §19
     * (Phase 5 Stewardship workflow UI) - the Difference column, pure
     * display arithmetic on the two real amounts already shown
     * (`depositedAmountMinor - verifiedTotalMinor`), not a new
     * reconciliation calculation - the backend's own `matched` boolean
     * (asserted above) remains the sole authority on match/mismatch. */
    it('shows the Difference column for a mismatched row, and "—" while unconfirmed', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              branchId: 'branch-1',
              weekStartDate: '2026-01-05',
              rows: [
                reconciliationRow({ groupId: 'group-1', matched: false, verifiedTotalMinor: '50000', depositedAmountMinor: '45000' }),
                reconciliationRow({ groupId: 'group-2', matched: false, depositedAmountMinor: null }),
              ],
            }),
          });
        }
        if (url.includes('/groups/')) {
          return Promise.resolve({ ok: true, json: async () => ({ id: 'group-1', name: 'Grace Bacenta', type: 'PASTORAL_CARE' }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByTestId('reconciliation-card')).toBeInTheDocument());
      // 450.00 deposited - 500.00 verified = -50.00
      expect(screen.getByText('GHS -50.00')).toBeInTheDocument();
    });

    /** `[UX Design Implementation]` Final UX Design Specification §19
     * (Phase 5 Stewardship workflow UI) - "make [immutability] clear
     * before confirmation." */
    it('tells the user a confirmed deposit is permanent, before they confirm it', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [reconciliationRow()] }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      fireEvent.click(await screen.findByRole('button', { name: /Confirm deposit for group/ }));

      expect(screen.getByText(/can.t be edited or deleted afterward/)).toBeInTheDocument();
    });

    it('confirms a deposit for an unmatched row, then refetches and shows the updated matched state', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      let reconciliationCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/bank-deposit-confirmations') && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 'bdc-1',
              branchId: 'branch-1',
              groupId: 'group-1',
              weekStartDate: '2026-01-05',
              depositedAmountMinor: '50000',
              currency: 'GHS',
              bankReference: null,
              confirmedByPersonId: 'person-1',
              createdAt: new Date().toISOString(),
            }),
          });
        }
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          reconciliationCallCount += 1;
          return Promise.resolve({
            ok: true,
            json: async () => ({
              branchId: 'branch-1',
              weekStartDate: '2026-01-05',
              rows: [reconciliationRow({ matched: reconciliationCallCount > 1, depositedAmountMinor: reconciliationCallCount > 1 ? '50000' : null })],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByText('Not yet confirmed')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /Confirm deposit for group/i }));

      const confirmButton = screen.getByTestId('confirm-deposit-submit');
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByTestId('confirm-deposit-amount'), { target: { value: '500' } });
      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining('/bank-deposit-confirmations'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ groupId: 'group-1', weekStartDate: '2026-01-05', depositedAmountMinor: '50000' }),
          }),
        ),
      );
      await waitFor(() => expect(screen.queryByTestId('confirm-deposit-form')).not.toBeInTheDocument());
      await waitFor(() => expect(screen.getByText('Matched')).toBeInTheDocument());
    });

    it('shows the server-provided error inline and keeps the confirm form open on a duplicate-confirmation 409', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/bank-deposit-confirmations') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({ message: "A bank deposit confirmation already exists for group 'group-1' for the week starting '2026-01-05'" }),
          });
        }
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [reconciliationRow()] }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByText('Not yet confirmed')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /Confirm deposit for group/i }));
      fireEvent.change(screen.getByTestId('confirm-deposit-amount'), { target: { value: '500' } });
      fireEvent.click(screen.getByTestId('confirm-deposit-submit'));

      await waitFor(() => expect(screen.getByText(/already exists for group 'group-1'/)).toBeInTheDocument());
      expect(screen.getByTestId('confirm-deposit-form')).toBeInTheDocument();
    });

    it('cancels the confirm form without sending a request', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [reconciliationRow()] }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByText('Not yet confirmed')).toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', { name: /Confirm deposit for group/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('confirm-deposit-form')).not.toBeInTheDocument();
    });

    it('shows a retryable error state when the reconciliation request fails (e.g. authorization denial)', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.reject(new Error('network unavailable in test'));
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByText("Couldn't load the weekly reconciliation")).toBeInTheDocument());
    });

    it('shows an empty state when nothing needs reconciling for the chosen week', async () => {
      mockUseAuth.mockReturnValue(actorWithRole('TREASURER'));
      global.fetch = jest.fn().mockImplementation((url: string) => {
        if (url.includes('/bank-deposit-confirmations/reconciliation')) {
          return Promise.resolve({ ok: true, json: async () => ({ branchId: 'branch-1', weekStartDate: '2026-01-05', rows: [] }) });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });

      renderPage();
      fireEvent.change(screen.getByLabelText('Week starting'), { target: { value: '2026-01-05' } });

      await waitFor(() => expect(screen.getByText('Nothing to reconcile')).toBeInTheDocument());
    });
  });
});
