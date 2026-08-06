import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { PastorDashboardScreen } from './PastorDashboardScreen';
import { NavigationProvider } from '../../navigation/Navigator';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'pastor-1',
    branchId: 'branch-1',
    role: 'RESIDENT_PASTOR',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <NavigationProvider>
        <PastorDashboardScreen />
      </NavigationProvider>
    </ThemeProvider>,
  );
}

describe('PastorDashboardScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the Branch Pulse score/band and open Alert count once the fetch resolves', async () => {
    global.fetch = jest.fn((url: string) =>
      url.includes('/insights/branch-dashboard')
        ? jsonResponse({
            branchId: 'branch-1',
            pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 55, computedAt: '2026-08-01T00:00:00.000Z' },
            alerts: [
              { id: 'a-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', alertType: 'SILENT_DRIFT', message: null, status: 'OPEN', resolvedByPersonId: null, resolvedAt: null, triggeredAt: '2026-08-01T00:00:00.000Z' },
            ],
          })
        : jsonResponse(null),
    ) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('55')).toBeTruthy());
    expect(screen.getByText('Needs attention')).toBeTruthy();
    expect(screen.getByText('1 open')).toBeTruthy();
  });

  it('shows "no open alerts" when the alerts array is empty', async () => {
    global.fetch = jest.fn(() =>
      jsonResponse({
        branchId: 'branch-1',
        pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'BRANCH', scopeId: 'branch-1', score: 90, computedAt: '2026-08-01T00:00:00.000Z' },
        alerts: [],
      }),
    ) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('No open alerts across your Branch.')).toBeTruthy());
  });
});
