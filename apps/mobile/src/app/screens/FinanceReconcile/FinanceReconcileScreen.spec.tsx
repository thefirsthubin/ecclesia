import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { FinanceReconcileScreen } from './FinanceReconcileScreen';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'treasurer-1',
    branchId: 'branch-1',
    role: 'TREASURER',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

const VERIFIED_TRANSACTION = {
  id: 't-1',
  branchId: 'branch-1',
  type: 'OFFERING',
  sourceGroupId: 'bacenta-1',
  giverPersonId: null,
  channel: 'CASH',
  amountMinor: '5000',
  currency: 'GHS',
  currentState: 'VERIFIED',
  recordedByPersonId: 'shepherd-1',
  createdAt: '2026-08-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <FinanceReconcileScreen />
    </ThemeProvider>,
  );
}

describe('FinanceReconcileScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows an unmatched row and lets a Treasurer open the confirm-deposit form', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/reconciliation')) {
        return jsonResponse({
          branchId: 'branch-1',
          weekStartDate: '2026-08-03',
          rows: [{ groupId: 'bacenta-1', verifiedTotalMinor: '5000', depositedAmountMinor: null, bankReference: null, matched: false }],
        });
      }
      if (url.includes('state=VERIFIED')) return jsonResponse([]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Unmatched')).toBeTruthy());
    expect(screen.getByText('No deposit confirmed yet')).toBeTruthy();

    fireEvent.press(screen.getByTestId('finance-reconcile-deposit-open-bacenta-1'));
    expect(screen.getByTestId('finance-reconcile-deposit-amount-bacenta-1')).toBeTruthy();
  });

  it('confirming a deposit refetches the reconciliation view', async () => {
    let confirmed = false;
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (url.endsWith('/bank-deposit-confirmations') && init?.method === 'POST') {
        confirmed = true;
        return jsonResponse({ id: 'bd-1', branchId: 'branch-1', groupId: 'bacenta-1', weekStartDate: '2026-08-03', depositedAmountMinor: '5000', currency: 'GHS', bankReference: null, confirmedByPersonId: 'treasurer-1', createdAt: '' });
      }
      if (url.includes('/reconciliation')) {
        return jsonResponse({
          branchId: 'branch-1',
          weekStartDate: '2026-08-03',
          rows: [{ groupId: 'bacenta-1', verifiedTotalMinor: '5000', depositedAmountMinor: confirmed ? '5000' : null, bankReference: null, matched: confirmed }],
        });
      }
      if (url.includes('state=VERIFIED')) return jsonResponse([]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('finance-reconcile-deposit-open-bacenta-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('finance-reconcile-deposit-open-bacenta-1'));
    fireEvent.changeText(screen.getByTestId('finance-reconcile-deposit-amount-bacenta-1'), '5000');
    fireEvent.press(screen.getByTestId('finance-reconcile-deposit-submit-bacenta-1'));

    await waitFor(() => expect(screen.getByText('Matched')).toBeTruthy());
  });

  it('lists Verified transactions and marks one Reconciled', async () => {
    let reconciled = false;
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/reconciliation')) return jsonResponse({ branchId: 'branch-1', weekStartDate: '2026-08-03', rows: [] });
      if (url.includes('/reconcile')) {
        reconciled = true;
        return jsonResponse({ ...VERIFIED_TRANSACTION, currentState: 'RECONCILED' });
      }
      if (url.includes('state=VERIFIED')) return jsonResponse(reconciled ? [] : [VERIFIED_TRANSACTION]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('finance-reconcile-mark-t-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('finance-reconcile-mark-t-1'));

    await waitFor(() => expect(screen.getByText('Nothing awaiting reconciliation')).toBeTruthy());
  });
});
