import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { FinanceVerifyScreen } from './FinanceVerifyScreen';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'treasurer-1',
    branchId: 'branch-1',
    role: 'TREASURER',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);
}

const TRANSACTION = {
  id: 't-1',
  branchId: 'branch-1',
  type: 'OFFERING',
  sourceGroupId: 'bacenta-1',
  giverPersonId: null,
  channel: 'CASH',
  amountMinor: '5000',
  currency: 'GHS',
  currentState: 'RECORDED',
  recordedByPersonId: 'shepherd-1',
  createdAt: '2026-08-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <FinanceVerifyScreen />
    </ThemeProvider>,
  );
}

describe('FinanceVerifyScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the positive empty state when nothing is RECORDED', async () => {
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('Nothing to verify')).toBeTruthy());
  });

  it('lists a RECORDED transaction with its amount', async () => {
    global.fetch = jest.fn((url: string) => (url.includes('state=RECORDED') ? jsonResponse([TRANSACTION]) : jsonResponse(null))) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('OFFERING')).toBeTruthy());
    expect(screen.getByText('GHS 50.00')).toBeTruthy();
  });

  it('Verify calls POST /financial-transactions/:id/verify and refetches', async () => {
    let verified = false;
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/verify')) {
        verified = true;
        return jsonResponse({ ...TRANSACTION, currentState: 'VERIFIED' });
      }
      if (url.includes('state=RECORDED')) {
        return jsonResponse(verified ? [] : [TRANSACTION]);
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('finance-verify-confirm-t-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('finance-verify-confirm-t-1'));

    await waitFor(() => expect(screen.getByText('Nothing to verify')).toBeTruthy());
  });

  it('Flag opens a reason input and submits it to POST /financial-transactions/:id/flag', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/flag')) return jsonResponse({ ...TRANSACTION, currentState: 'FLAGGED' });
      if (url.includes('state=RECORDED')) return jsonResponse([TRANSACTION]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('finance-verify-flag-t-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('finance-verify-flag-t-1'));
    fireEvent.changeText(screen.getByTestId('finance-verify-flag-reason-t-1'), "Amount doesn't match the count");
    fireEvent.press(screen.getByTestId('finance-verify-flag-submit-t-1'));

    await waitFor(() => expect(screen.queryByTestId('finance-verify-flag-reason-t-1')).toBeNull());
  });

  it('surfaces a server rejection (e.g. BR-STW-04 same-actor denial) as an inline error', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/verify')) return jsonResponse({ message: 'Forbidden' }, 403);
      if (url.includes('state=RECORDED')) return jsonResponse([TRANSACTION]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('finance-verify-confirm-t-1')).toBeTruthy());
    fireEvent.press(screen.getByTestId('finance-verify-confirm-t-1'));

    await waitFor(() => expect(screen.getByText(/failed with status 403/)).toBeTruthy());
  });
});
