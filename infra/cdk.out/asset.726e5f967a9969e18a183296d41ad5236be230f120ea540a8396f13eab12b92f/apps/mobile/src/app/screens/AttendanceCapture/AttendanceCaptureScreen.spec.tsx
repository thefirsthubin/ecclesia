import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { AttendanceCaptureScreen } from './AttendanceCaptureScreen';

jest.mock('../../lib/session', () => ({
  useSession: () => ({
    personId: 'shepherd-1',
    branchId: 'branch-1',
    bacentaGroupId: 'bacenta-1',
    authToken: 'token-1',
  }),
}));

const mockSwitchTab = jest.fn();
jest.mock('../../navigation/Navigator', () => ({
  ...jest.requireActual('../../navigation/Navigator'),
  useSwitchTab: () => mockSwitchTab,
}));

const GATHERING = {
  id: 'g-1',
  branchId: 'branch-1',
  ownerGroupId: 'bacenta-1',
  seriesId: null,
  type: 'BACENTA_MEETING',
  scheduledStart: new Date().toISOString(),
  scheduledEnd: null,
  venue: "Sister Ama's house",
  status: 'SCHEDULED',
  config: null,
  createdByPersonId: 'shepherd-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const PEOPLE = [
  { id: 'p-1', branchId: 'branch-1', firstName: 'Ama', lastName: 'Owusu', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'MEMBER', guardianPersonId: null, createdAt: '', updatedAt: '' },
  { id: 'p-2', branchId: 'branch-1', firstName: 'Kojo', lastName: 'Boateng', phone: null, email: null, dateOfBirth: null, address: null, lifecycleStage: 'MEMBER', guardianPersonId: null, createdAt: '', updatedAt: '' },
];

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

/**
 * Integration test mirroring `ShepherdDashboardScreen.spec.tsx`'s pattern:
 * mock `global.fetch` by URL substring against the three real,
 * unmodified endpoints this screen composes (see
 * `useAttendanceCaptureData.ts`'s own doc comment / `ATTENDANCE_CAPTURE_DESIGN_NOTES.md`).
 */
describe('AttendanceCaptureScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
    mockSwitchTab.mockReset();
  });

  it('loads the roster, pre-populates an existing record, and saves only the changed rows', async () => {
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (url.includes('/gatherings?')) return jsonResponse([GATHERING]);
      if (url.includes('/people?groupId=')) return jsonResponse(PEOPLE);
      if (url.endsWith('/attendance-records') && (!init || init.method === undefined)) {
        return jsonResponse([{ id: 'ar-1', gatheringId: 'g-1', personId: 'p-1', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'shepherd-1', recordedAt: '2026-08-01T00:00:00.000Z' }]);
      }
      if (url.includes('/attendance-records') && init?.method === 'POST') {
        return jsonResponse({ id: 'ar-2', gatheringId: 'g-1', personId: 'p-2', branchId: 'branch-1', status: 'ABSENT', recordedByPersonId: 'shepherd-1', recordedAt: '2026-08-02T00:00:00.000Z' });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <AttendanceCaptureScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeTruthy());
    expect(screen.getByText('Kojo Boateng')).toBeTruthy();
    expect(screen.getByText("Sister Ama's house")).toBeTruthy();

    // p-1 (Ama) was pre-populated PRESENT from the existing attendance
    // record - its "Present" radio starts selected.
    expect(screen.getByLabelText('Ama Owusu: Present').props.accessibilityState.selected).toBe(true);

    // Save starts disabled - nothing has changed yet.
    expect(screen.getByTestId('attendance-capture-save').props.accessibilityState.disabled).toBe(true);

    // Mark Kojo (p-2) Absent.
    fireEvent.press(screen.getByLabelText('Kojo Boateng: Absent'));
    expect(screen.getByTestId('attendance-capture-save').props.accessibilityState.disabled).toBe(false);

    fireEvent.press(screen.getByTestId('attendance-capture-save'));

    await waitFor(() => expect(mockSwitchTab).toHaveBeenCalledWith('dashboard'));

    // Only the one changed row (p-2) was POSTed - Ama's unchanged PRESENT
    // status was not re-sent.
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) => init?.method === 'POST');
    expect(postCalls).toHaveLength(1);
    expect(JSON.parse(postCalls[0][1].body)).toEqual({ personId: 'p-2', status: 'ABSENT' });
  });

  it("shows an empty state when there's no Gathering scheduled today", async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/gatherings?')) return jsonResponse([]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <AttendanceCaptureScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('No meeting scheduled today')).toBeTruthy());
  });

  it('shows a retryable error state when the roster fails to load', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve(null) } as Response)) as unknown as typeof fetch;

    render(
      <ThemeProvider>
        <AttendanceCaptureScreen />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Couldn't load the roster")).toBeTruthy());
  });
});
