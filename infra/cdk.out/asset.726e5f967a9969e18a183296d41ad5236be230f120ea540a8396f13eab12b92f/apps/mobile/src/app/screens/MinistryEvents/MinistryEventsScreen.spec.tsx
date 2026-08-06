import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { MinistryEventsScreen } from './MinistryEventsScreen';

jest.mock('../../lib/session', () => ({
  useMinistrySession: () => ({
    personId: 'ministry-1',
    branchId: 'branch-1',
    basontaGroupId: 'basonta-1',
    authToken: 'token-1',
  }),
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);
}

const EVENT = {
  id: 'g-1',
  branchId: 'branch-1',
  ownerGroupId: 'basonta-1',
  seriesId: null,
  type: 'REHEARSAL',
  scheduledStart: '2026-08-10T18:00:00.000Z',
  scheduledEnd: null,
  venue: 'Main Hall',
  status: 'SCHEDULED',
  config: null,
  createdByPersonId: 'ministry-1',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <MinistryEventsScreen />
    </ThemeProvider>,
  );
}

describe('MinistryEventsScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('lists existing Events once the fetch resolves', async () => {
    global.fetch = jest.fn((url: string) => (url.includes('/gatherings?') ? jsonResponse([EVENT]) : jsonResponse(null))) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('REHEARSAL')).toBeTruthy());
    expect(screen.getByText('Main Hall', { exact: false })).toBeTruthy();
  });

  it('shows the positive empty state when there are no Events', async () => {
    global.fetch = jest.fn(() => jsonResponse([])) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('No Events scheduled')).toBeTruthy());
  });

  it('submits a new Event and refetches the list', async () => {
    let createCalled = false;
    global.fetch = jest.fn((url: string, init?: RequestInit) => {
      if (url.includes('/gatherings?')) {
        return jsonResponse(createCalled ? [EVENT] : []);
      }
      if (url.endsWith('/gatherings') && init?.method === 'POST') {
        createCalled = true;
        return jsonResponse(EVENT);
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('No Events scheduled')).toBeTruthy());

    fireEvent.press(screen.getByTestId('ministry-events-toggle-form'));
    fireEvent.changeText(screen.getByTestId('ministry-events-scheduled-start'), '2026-08-10T18:00');
    fireEvent.press(screen.getByTestId('ministry-events-submit'));

    await waitFor(() => expect(screen.getByText('REHEARSAL')).toBeTruthy());
  });
});
