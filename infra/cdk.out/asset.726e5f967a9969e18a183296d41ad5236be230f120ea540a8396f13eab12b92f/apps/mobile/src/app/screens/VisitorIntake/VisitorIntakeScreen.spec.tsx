import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { VisitorIntakeScreen } from './VisitorIntakeScreen';

jest.mock('../../lib/session', () => ({
  useActorSession: () => ({
    personId: 'usher-1',
    branchId: 'branch-1',
    role: 'USHER',
    authToken: 'token-1',
  }),
}));

const mockSwitchTab = jest.fn();
jest.mock('../../navigation/Navigator', () => ({
  ...jest.requireActual('../../navigation/Navigator'),
  useSwitchTab: () => mockSwitchTab,
}));

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(body) } as Response);
}

const BACENTA = {
  id: 'bacenta-1',
  branchId: 'branch-1',
  type: 'PASTORAL_CARE',
  name: 'Grace Bacenta',
  meetingSchedule: null,
  meetingLocation: null,
  category: null,
  lifecycleStatus: 'ACTIVE',
};

function renderScreen() {
  return render(
    <ThemeProvider>
      <VisitorIntakeScreen />
    </ThemeProvider>,
  );
}

function defaultFetch(overrides: (url: string, init?: RequestInit) => Response | undefined) {
  return jest.fn((url: string, init?: RequestInit) => {
    const override = overrides(url, init);
    if (override) return Promise.resolve(override);
    if (url.includes('/gatherings?')) return jsonResponse([]);
    if (url.includes('/groups?type=PASTORAL_CARE')) return jsonResponse([BACENTA]);
    return jsonResponse(null);
  }) as unknown as typeof fetch;
}

describe('VisitorIntakeScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Capture Visitor stays disabled until first and last name are both entered', async () => {
    global.fetch = defaultFetch(() => undefined);
    renderScreen();

    expect(screen.getByTestId('visitor-intake-submit').props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId('visitor-intake-first-name'), 'Ama');
    expect(screen.getByTestId('visitor-intake-submit').props.accessibilityState.disabled).toBe(true);
    fireEvent.changeText(screen.getByTestId('visitor-intake-last-name'), 'Owusu');
    await waitFor(() => expect(screen.getByTestId('visitor-intake-submit').props.accessibilityState.disabled).toBe(false));
  });

  it('submits POST /visitor-intake with the entered fields and shows the confirmation', async () => {
    global.fetch = defaultFetch((url, init) => {
      if (init?.method === 'POST' && url.includes('/visitor-intake')) {
        return { ok: true, status: 201, json: () => Promise.resolve({ id: 'vi-1', branchId: 'branch-1', gatheringId: null, personId: 'person-1', submittedData: {}, createdAt: '', followUpTaskCreated: false }) } as unknown as Response;
      }
      return undefined;
    });

    renderScreen();
    fireEvent.changeText(screen.getByTestId('visitor-intake-first-name'), 'Ama');
    fireEvent.changeText(screen.getByTestId('visitor-intake-last-name'), 'Owusu');
    fireEvent.press(screen.getByTestId('visitor-intake-submit'));

    await waitFor(() => expect(screen.getByTestId('visitor-intake-confirmation')).toBeTruthy());
    expect(screen.getByText('Visitor captured')).toBeTruthy();

    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]: [string, RequestInit?]) => init?.method === 'POST');
    expect(postCalls).toHaveLength(1);
    expect(postCalls[0][0]).toContain('/visitor-intake');
    expect(JSON.parse(postCalls[0][1].body)).toEqual({
      gatheringId: undefined,
      firstName: 'Ama',
      lastName: 'Owusu',
      phone: undefined,
      howTheyHeard: undefined,
      firstTimeGuest: false,
      bacentaPreferenceGroupId: undefined,
    });
  });

  it('picking a Bacenta preference includes bacentaPreferenceGroupId in the submission', async () => {
    global.fetch = defaultFetch((url, init) => {
      if (init?.method === 'POST' && url.includes('/visitor-intake')) {
        return { ok: true, status: 201, json: () => Promise.resolve({ id: 'vi-2', branchId: 'branch-1', gatheringId: null, personId: 'person-2', submittedData: {}, createdAt: '', followUpTaskCreated: true }) } as unknown as Response;
      }
      return undefined;
    });

    renderScreen();
    await waitFor(() => expect(screen.getByTestId('visitor-intake-bacenta-preference')).toBeTruthy());

    fireEvent.changeText(screen.getByTestId('visitor-intake-first-name'), 'Ama');
    fireEvent.changeText(screen.getByTestId('visitor-intake-last-name'), 'Owusu');

    fireEvent.press(screen.getByTestId('visitor-intake-bacenta-preference'));
    const input = await screen.findByLabelText('Search');
    fireEvent.changeText(input, 'Grace');
    await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeTruthy());
    fireEvent.press(screen.getByText('Grace Bacenta'));

    fireEvent.press(screen.getByTestId('visitor-intake-submit'));

    await waitFor(() => expect(screen.getByText('A Follow-up task was created automatically for their Shepherd.')).toBeTruthy());
    const postCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]: [string, RequestInit?]) => init?.method === 'POST');
    expect(JSON.parse(postCalls[0][1].body).bacentaPreferenceGroupId).toBe('bacenta-1');
  });

  it('"Capture another" resets the form back to a fresh, editable state', async () => {
    global.fetch = defaultFetch((url, init) => {
      if (init?.method === 'POST' && url.includes('/visitor-intake')) {
        return { ok: true, status: 201, json: () => Promise.resolve({ id: 'vi-3', branchId: 'branch-1', gatheringId: null, personId: 'person-3', submittedData: {}, createdAt: '', followUpTaskCreated: false }) } as unknown as Response;
      }
      return undefined;
    });

    renderScreen();
    fireEvent.changeText(screen.getByTestId('visitor-intake-first-name'), 'Ama');
    fireEvent.changeText(screen.getByTestId('visitor-intake-last-name'), 'Owusu');
    fireEvent.press(screen.getByTestId('visitor-intake-submit'));

    await waitFor(() => expect(screen.getByTestId('visitor-intake-confirmation')).toBeTruthy());
    fireEvent.press(screen.getByTestId('visitor-intake-again'));

    await waitFor(() => expect(screen.getByTestId('visitor-intake-first-name')).toBeTruthy());
    expect(screen.getByTestId('visitor-intake-first-name').props.value).toBe('');
    expect(screen.getByTestId('visitor-intake-submit').props.accessibilityState.disabled).toBe(true);
  });

  it('surfaces a submission failure as an inline error', async () => {
    global.fetch = defaultFetch((url, init) => {
      if (init?.method === 'POST' && url.includes('/visitor-intake')) {
        return { ok: false, status: 409, json: () => Promise.resolve({ message: 'Possible duplicate' }) } as unknown as Response;
      }
      return undefined;
    });

    renderScreen();
    fireEvent.changeText(screen.getByTestId('visitor-intake-first-name'), 'Ama');
    fireEvent.changeText(screen.getByTestId('visitor-intake-last-name'), 'Owusu');
    fireEvent.press(screen.getByTestId('visitor-intake-submit'));

    await waitFor(() => expect(screen.getByText(/failed with status 409/)).toBeTruthy());
  });
});
