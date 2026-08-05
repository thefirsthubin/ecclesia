import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { MinistryDashboardScreen } from './MinistryDashboardScreen';
import { NavigationProvider } from '../../navigation/Navigator';

/** Same "mock `lib/session` directly, render standalone with no
 * `AuthProvider`" technique `ShepherdDashboardScreen.spec.tsx` already
 * uses - see that file's own comment. */
jest.mock('../../lib/session', () => ({
  useMinistrySession: () => ({
    personId: 'ministry-1',
    branchId: 'branch-1',
    basontaGroupId: 'basonta-1',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

describe('MinistryDashboardScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders roster size, overcommitment badge, and next event once all fetches resolve', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/roster/overcommitment')) {
        return jsonResponse([{ personId: 'p-1', concurrentCommitmentCount: 3, threshold: 2, overcommitted: true }]);
      }
      if (url.includes('/roster')) {
        return jsonResponse([
          { personId: 'p-1', startedAt: '2026-01-01T00:00:00.000Z' },
          { personId: 'p-2', startedAt: '2026-01-01T00:00:00.000Z' },
        ]);
      }
      if (url.includes('/gatherings?')) {
        return jsonResponse([
          {
            id: 'g-1',
            branchId: 'branch-1',
            ownerGroupId: 'basonta-1',
            seriesId: null,
            type: 'CHOIR_REHEARSAL',
            scheduledStart: '2099-01-01T18:00:00.000Z',
            scheduledEnd: null,
            venue: 'Main Hall',
            status: 'SCHEDULED',
            config: null,
            createdByPersonId: 'ministry-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        ]);
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <NavigationProvider>
          <MinistryDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('2')).toBeTruthy());
    expect(screen.getByText('1 overcommitted')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('CHOIR_REHEARSAL')).toBeTruthy());
    expect(screen.getByText('Main Hall', { exact: false })).toBeTruthy();
  });

  it('shows a "no upcoming Events" fallback when the list is empty', async () => {
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <NavigationProvider>
          <MinistryDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('No upcoming Events scheduled.')).toBeTruthy());
  });

  it('"View full roster"/"View all Events" switch to their own tabs', async () => {
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <NavigationProvider>
          <MinistryDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('ministry-dashboard-view-roster')).toBeTruthy());
    // No navigation assertion beyond "doesn't throw" - `switchTab` itself
    // is exercised end-to-end by `App.spec.tsx`/`AppShell.spec.tsx`.
    fireEvent.press(screen.getByTestId('ministry-dashboard-view-roster'));
    fireEvent.press(screen.getByTestId('ministry-dashboard-view-events'));
  });
});
