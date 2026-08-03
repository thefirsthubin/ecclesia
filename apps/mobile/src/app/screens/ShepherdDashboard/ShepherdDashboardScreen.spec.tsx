import { render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { ShepherdDashboardScreen } from './ShepherdDashboardScreen';
import { NavigationProvider } from '../../navigation/Navigator';

// `[Mobile Application Shell sprint]` `useSession()` (called by every
// dashboard hook via `useShepherdDashboardData.ts`) now reads the
// authenticated actor from `AuthContext` instead of returning fixed
// placeholders (see `lib/session.ts`'s own top comment) - this test
// predates that and renders `ShepherdDashboardScreen` standalone, with no
// `AuthProvider` ancestor to satisfy it. Mocking `lib/session` directly
// keeps this test's original, narrower purpose (does each card resolve
// real fetched data correctly) without pulling in a full mocked auth
// flow - `AttendanceCaptureScreen.spec.tsx` uses this same technique.
jest.mock('../../lib/session', () => ({
  useSession: () => ({
    personId: 'shepherd-1',
    branchId: 'branch-1',
    bacentaGroupId: 'bacenta-1',
    authToken: 'token-1',
  }),
}));

const GATHERING = {
  id: 'g-1',
  branchId: 'branch-1',
  ownerGroupId: 'bacenta-1',
  seriesId: null,
  type: 'BACENTA_MEETING',
  scheduledStart: '2026-08-05T18:00:00.000Z',
  scheduledEnd: null,
  venue: 'Sister Ama\'s house',
  status: 'SCHEDULED',
  config: null,
  createdByPersonId: 'shepherd-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

/**
 * Integration test (STEP 10): renders the whole screen with every
 * endpoint named in `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6 mocked,
 * and asserts each of the 5-zone cards (Design System §4.2) resolves to
 * real content - not just that individual cards render in isolation
 * (covered separately by e.g. `ChurchPulseCard.spec.tsx`/
 * `PriorityCard.spec.tsx`).
 */
describe('ShepherdDashboardScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/insights/bacenta-dashboard/')) {
        return jsonResponse({
          branchId: 'branch-1',
          groupId: 'bacenta-1',
          pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 74, computedAt: '2026-08-01T00:00:00.000Z' },
          alerts: [],
        });
      }
      if (url.includes('/follow-up-tasks')) {
        return jsonResponse([]);
      }
      if (url.includes('/silent-drift-flags')) {
        return jsonResponse([]);
      }
      if (url.includes('/attendance-records')) {
        return jsonResponse([
          { id: 'ar-1', gatheringId: 'g-1', personId: 'p-1', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'shepherd-1', recordedAt: '2026-08-01T00:00:00.000Z' },
        ]);
      }
      if (url.includes('/gatherings?')) {
        return jsonResponse([GATHERING]);
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders every dashboard card with real data once all fetches resolve', async () => {
    render(
      <ThemeProvider>
        <NavigationProvider>
          <ShepherdDashboardScreen />
        </NavigationProvider>
      </ThemeProvider>,
    );

    // Priority zone (Design System §4.2/§4.3) - the PRD's own "single
    // most important screen" content resolves to its positive empty
    // state once both underlying fetches (open follow-ups, drift flags)
    // succeed with no rows.
    await waitFor(() => expect(screen.getByText('All caught up')).toBeTruthy());

    // Primary metric zone (Church Pulse).
    expect(screen.getByText('74')).toBeTruthy();

    // Today's-meeting / Attendance-summary cards, composed from the
    // reused `GET /gatherings` + `GET /gatherings/:id/attendance-records`
    // endpoints (STEP 6).
    expect(screen.getByText("Sister Ama's house")).toBeTruthy();

    // Quick actions zone - both NFR-PERF-01-named critical actions.
    expect(screen.getByTestId('quick-action-take-attendance')).toBeTruthy();
    expect(screen.getByTestId('quick-action-record-offering')).toBeTruthy();

    // Notifications zone.
    expect(screen.getByText('No alerts')).toBeTruthy();

    // Accessibility (STEP 7): every card heading is a real header,
    // discoverable by assistive technology via `accessibilityRole`.
    expect(screen.getAllByRole('header').length).toBeGreaterThan(3);
  });
});
