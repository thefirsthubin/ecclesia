import { fireEvent, render, screen } from '@testing-library/react-native';

import { App } from './App';
import * as authContext from './auth/AuthContext';

/**
 * `[Mobile Application Shell sprint]` Replaces this file's original
 * Shepherd Dashboard sprint test, which rendered `<App />` directly
 * against a mocked `fetch` and asserted the dashboard's header text -
 * that assumed `App.tsx` renders `ShepherdDashboardScreen`
 * unconditionally, which stopped being true once this sprint added the
 * `AuthProvider`/`NavigationProvider` gate (see `App.tsx`'s own top
 * comment). This now covers `RootNavigator`'s branch logic instead - the
 * one place the auth gate and navigator are wired together - with
 * `useAuth` mocked directly so each branch (`restoring`,
 * `unauthenticated`, `unsupported`, `authenticated`) can be asserted
 * without a real `/auth/mode` round-trip. Each real screen is mocked to a
 * simple text marker; their own data-fetching is covered by their own
 * spec files (`ShepherdDashboardScreen.spec.tsx`,
 * `AttendanceCaptureScreen.spec.tsx`, `LoginScreen.spec.tsx`).
 *
 * Each mock factory below reaches for `react-native` *inside* the factory
 * (via `jest.requireActual`, not a top-level `import { Text }`) - Jest's
 * `babel-plugin-jest-hoist` moves every `jest.mock()` call above this
 * file's own imports, so a factory that closes over an outer-scope import
 * binding fails at module-load time with "The module factory of
 * jest.mock() is not allowed to reference any out-of-scope variables"
 * (this is exactly what "Test suite failed to run" was, before this
 * fix). A first attempt used a raw `require('react-native')` call inside
 * the factory instead, which does dodge that restriction, but trips this
 * workspace's `@typescript-eslint/no-require-imports` lint rule -
 * `jest.requireActual` (already used elsewhere in this file, and in
 * `apps/web-admin`'s own `AuthContext.spec.tsx`) is Jest's own API, not a
 * `require()` call, so it satisfies both constraints at once.
 */
jest.mock('./auth/AuthContext', () => ({
  ...jest.requireActual('./auth/AuthContext'),
  useAuth: jest.fn(),
}));
const mockedUseAuth = authContext.useAuth as jest.Mock;

jest.mock('./screens/Login/LoginScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return { LoginScreen: () => <Text>login-screen</Text> };
});
jest.mock('./screens/Login/SessionRestoringScreen', () => {
  const { Text } = jest.requireActual('react-native');
  return { SessionRestoringScreen: () => <Text>restoring-screen</Text> };
});
jest.mock('./screens/ShepherdDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { ShepherdDashboardScreen: () => <Text>dashboard-screen</Text> };
});
jest.mock('./screens/AttendanceCapture', () => {
  const { Text } = jest.requireActual('react-native');
  return { AttendanceCaptureScreen: () => <Text>attendance-capture-screen</Text> };
});
jest.mock('./screens/OfferingRecording', () => {
  const { Text } = jest.requireActual('react-native');
  return { OfferingRecordingScreen: () => <Text>offering-recording-screen</Text> };
});
jest.mock('./screens/FollowUpQueue', () => {
  const { Text } = jest.requireActual('react-native');
  return { FollowUpQueueScreen: () => <Text>follow-up-queue-screen</Text> };
});
jest.mock('./screens/Profile', () => {
  const { Text } = jest.requireActual('react-native');
  return { ProfileScreen: () => <Text>profile-screen</Text> };
});

describe('App / RootNavigator', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders SessionRestoringScreen while auth state is restoring', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'restoring' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });
    render(<App />);
    expect(screen.getByText('restoring-screen')).toBeTruthy();
  });

  it('renders LoginScreen when unauthenticated', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });
    render(<App />);
    expect(screen.getByText('login-screen')).toBeTruthy();
  });

  it('renders LoginScreen (its own unsupported branch) when the API is in cognito mode', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unsupported', mode: 'cognito' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });
    render(<App />);
    expect(screen.getByText('login-screen')).toBeTruthy();
  });

  it('renders ShepherdDashboardScreen by default once authenticated, inside the real bottom tab bar', () => {
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-1',
        actor: { personId: 'p-1', role: 'BACENTA_LEADER', branchId: 'b-1', bacentaId: 'bg-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });
    render(<App />);
    expect(screen.getByText('dashboard-screen')).toBeTruthy();

    // `[Stewardship gaps sprint]` AppShell's real, unmocked BottomNav -
    // all five Design System §3.2 tabs, Dashboard active by default.
    expect(screen.getByTestId('shepherd-bottom-nav')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(true);
  });

  it('pressing a bottom-tab-bar item switches which screen CurrentScreen renders', () => {
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-1',
        actor: { personId: 'p-1', role: 'BACENTA_LEADER', branchId: 'b-1', bacentaId: 'bg-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });
    render(<App />);

    fireEvent.press(screen.getByRole('tab', { name: 'Follow-ups' }));

    expect(screen.getByText('follow-up-queue-screen')).toBeTruthy();
    expect(screen.queryByText('dashboard-screen')).toBeNull();
  });
});
