import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { UsherDashboardScreen } from './UsherDashboardScreen';

const mockSwitchTab = jest.fn();
jest.mock('../../navigation/Navigator', () => ({
  useSwitchTab: () => mockSwitchTab,
}));

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

function renderScreen() {
  return render(
    <ThemeProvider>
      <UsherDashboardScreen />
    </ThemeProvider>,
  );
}

describe('UsherDashboardScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a "no Gathering scheduled today" fallback', async () => {
    global.fetch = jest.fn((url: string) => (url.includes('/gatherings?') ? jsonResponse([]) : jsonResponse(null))) as unknown as typeof fetch;
    renderScreen();
    await waitFor(() => expect(screen.getByText('No Gathering scheduled today')).toBeTruthy());
  });

  it('shows today\'s Gathering with its recorded-attendance count and links to Attendance', async () => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/gatherings?')) return jsonResponse([GATHERING]);
      if (url.includes('/attendance-records')) return jsonResponse([{ id: 'ar-1' }, { id: 'ar-2' }]);
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('SUNDAY_SERVICE')).toBeTruthy());
    expect(screen.getByText('2 recorded')).toBeTruthy();

    fireEvent.press(screen.getByTestId('usher-dashboard-view-attendance'));
    expect(mockSwitchTab).toHaveBeenCalledWith('usher-attendance');
  });

  it('"Go to Visitor Intake" switches to the visitor-intake tab', async () => {
    global.fetch = jest.fn((url: string) => (url.includes('/gatherings?') ? jsonResponse([]) : jsonResponse(null))) as unknown as typeof fetch;
    renderScreen();

    await waitFor(() => expect(screen.getByTestId('usher-dashboard-view-visitor-intake')).toBeTruthy());
    fireEvent.press(screen.getByTestId('usher-dashboard-view-visitor-intake'));
    expect(mockSwitchTab).toHaveBeenCalledWith('visitor-intake');
  });
});
