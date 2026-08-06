import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { UsherAttendanceScreen } from './UsherAttendanceScreen';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'usher-1',
    branchId: 'branch-1',
    role: 'USHER',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);
}

const GATHERING = {
  id: 'gathering-1',
  branchId: 'branch-1',
  ownerGroupId: null,
  seriesId: null,
  type: 'SUNDAY_SERVICE',
  scheduledStart: '2026-08-09T09:00:00.000Z',
  scheduledEnd: null,
  venue: 'Main Auditorium',
  status: 'SCHEDULED',
  config: null,
  createdByPersonId: 'admin-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

const PERSON = {
  id: 'person-1',
  branchId: 'branch-1',
  firstName: 'Kojo',
  lastName: 'Boateng',
  phone: '0555555555',
  email: 'kojo@example.com',
  dateOfBirth: null,
  address: null,
  lifecycleStage: 'MEMBER',
  guardianPersonId: null,
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <UsherAttendanceScreen />
    </ThemeProvider>,
  );
}

describe('UsherAttendanceScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a "no Gathering scheduled today" empty state', async () => {
    global.fetch = jest.fn((url: string) => (url.includes('/gatherings?') ? jsonResponse([]) : jsonResponse(null))) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('No Gathering scheduled today')).toBeTruthy());
  });

  it('shows the Gathering type/venue and recorded count', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/gatherings?')) return jsonResponse([GATHERING]);
      if (url.includes('/attendance-records')) return jsonResponse([{ id: 'ar-1', gatheringId: 'gathering-1', personId: 'p-existing', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'usher-1', recordedAt: '' }]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeTruthy());
    expect(screen.getByText('Main Auditorium')).toBeTruthy();
    expect(screen.getByText('1 recorded')).toBeTruthy();
  });

  it('searching and selecting a person records PRESENT attendance and lists them under "Checked in this session"', async () => {
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/attendance-records')) {
        return jsonResponse({ id: 'ar-2', gatheringId: 'gathering-1', personId: 'person-1', branchId: 'branch-1', status: 'PRESENT', recordedByPersonId: 'usher-1', recordedAt: '' });
      }
      if (url.includes('/gatherings?')) return jsonResponse([GATHERING]);
      if (url.includes('/people?search=')) return jsonResponse([PERSON]);
      if (url.includes('/attendance-records')) return jsonResponse([]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('usher-attendance-search')).toBeTruthy());
    fireEvent.press(screen.getByTestId('usher-attendance-search'));
    const input = await screen.findByLabelText('Search');
    fireEvent.changeText(input, 'Kojo');

    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeTruthy());
    fireEvent.press(screen.getByText('Kojo Boateng'));

    await waitFor(() => expect(screen.getByTestId('usher-attendance-session-list')).toBeTruthy());
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]: [string, RequestInit?]) => init?.method === 'POST');
    expect(postCalls).toHaveLength(1);
    expect(JSON.parse(postCalls[0][1].body)).toEqual({ personId: 'person-1', status: 'PRESENT' });
  });

  it('search results never surface phone or email - only name and lifecycle stage', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/gatherings?')) return jsonResponse([GATHERING]);
      if (url.includes('/people?search=')) return jsonResponse([{ ...PERSON, lifecycleStage: 'VISITOR' }]);
      if (url.includes('/attendance-records')) return jsonResponse([]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByTestId('usher-attendance-search')).toBeTruthy());
    fireEvent.press(screen.getByTestId('usher-attendance-search'));
    const input = await screen.findByLabelText('Search');
    fireEvent.changeText(input, 'Kojo');

    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeTruthy());
    expect(screen.getByText('Visitor')).toBeTruthy();
    expect(screen.queryByText(PERSON.phone)).toBeNull();
    expect(screen.queryByText(PERSON.email)).toBeNull();
  });

  it('shows a retryable error state when today\'s Gathering fails to load', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ message: 'boom' }) } as Response)) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByTestId('usher-attendance-error')).toBeTruthy());
  });
});
