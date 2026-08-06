import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { FinanceDashboardScreen } from './FinanceDashboardScreen';
import { NavigationProvider } from '../../navigation/Navigator';

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

describe('FinanceDashboardScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows counts once both fetches resolve', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('state=RECORDED')) {
        return jsonResponse([
          { id: 't-1', branchId: 'branch-1', type: 'OFFERING', sourceGroupId: 'bacenta-1', giverPersonId: null, channel: 'CASH', amountMinor: '5000', currency: 'GHS', currentState: 'RECORDED', recordedByPersonId: 'shepherd-1', createdAt: '' },
        ]);
      }
      if (url.includes('/reconciliation')) {
        return jsonResponse({
          branchId: 'branch-1',
          weekStartDate: '2026-08-03',
          rows: [
            { groupId: 'bacenta-1', verifiedTotalMinor: '5000', depositedAmountMinor: null, bankReference: null, matched: false },
          ],
        });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <NavigationProvider>
          <FinanceDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('1 entry recorded and waiting for review.')).toBeTruthy());
    expect(screen.getByText('1 unmatched')).toBeTruthy();
  });

  it('shows a caught-up state when nothing is pending', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('state=RECORDED')) return jsonResponse([]);
      if (url.includes('/reconciliation')) return jsonResponse({ branchId: 'branch-1', weekStartDate: '2026-08-03', rows: [] });
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <NavigationProvider>
          <FinanceDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('Nothing waiting on you right now.')).toBeTruthy());
    expect(screen.getByText('No Bacentas have offerings or deposits recorded for this week yet.')).toBeTruthy();
  });
});
