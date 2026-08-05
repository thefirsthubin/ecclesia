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
 * `AttendanceCaptureScreen.spec.tsx`, `LoginScreen.spec.tsx`, and each
 * new persona's own screen specs added this sprint).
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
 * `jest.requireActual` is Jest's own API, not a `require()` call, so it
 * satisfies both constraints at once.
 *
 * `[Bug fix]` This file's real, unmocked `AppShell` render (the tests
 * below that reach `state.status === 'authenticated'`) failed with
 * "Element type is invalid... got undefined, check the render method of
 * AppShell", isolated via a temporary debug log to `SafeAreaView`
 * specifically (`View`/`BottomNav` were always fine). Root cause, found
 * by reading the installed package directly (`react-native@0.75.4`'s own
 * source, not a guess): unlike `View`/`Text`/`Image`/etc., RN's own
 * `jest/setup.js` never mocks `SafeAreaView` - it's deprecated in RN core
 * (this codebase has no `react-native-safe-area-context` dependency
 * either, per `AppShell.tsx`'s own doc comment) - so RN's real jest
 * preset doesn't bother stubbing it. Its real implementation
 * (`Libraries/Components/SafeAreaView/SafeAreaView.js`) is
 * `Platform.select({ ios: require('./RCTSafeAreaViewNativeComponent').default, default: View })`
 * - a Codegen native-component spec with no backing native view config in
 * this Jest environment, which resolves to `undefined` here rather than a
 * usable component. Why `AppShell.spec.tsx` (which also renders the real,
 * unmocked `SafeAreaView`) doesn't hit the same failure is not fully
 * explained - plausibly a module-registry/load-order interaction with
 * this file's several `jest.mock()` factories - but the fix below doesn't
 * depend on nailing that down: it removes the fragile real resolution
 * from this file's render path entirely. Fixed by explicitly mocking it
 * the same way `jest/setup.js` mocks every
 * other RN primitive - substituting `View` (proven to resolve correctly
 * in this environment), which is a safe stand-in here: `SafeAreaView` is
 * already a documented no-op on Android in this app (see `AppShell.tsx`),
 * so a plain `View` is behaviourally equivalent for what these tests
 * assert.
 */
jest.mock('react-native/Libraries/Components/SafeAreaView/SafeAreaView', () => {
  const { View } = jest.requireActual('react-native');
  return { __esModule: true, default: View };
});

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

// `[Mobile Personas sprint]` One mock factory per new persona screen,
// same pattern as the seven above.
jest.mock('./screens/MinistryDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { MinistryDashboardScreen: () => <Text>ministry-dashboard-screen</Text> };
});
jest.mock('./screens/MinistryRoster', () => {
  const { Text } = jest.requireActual('react-native');
  return { MinistryRosterScreen: () => <Text>ministry-roster-screen</Text> };
});
jest.mock('./screens/MinistryEvents', () => {
  const { Text } = jest.requireActual('react-native');
  return { MinistryEventsScreen: () => <Text>ministry-events-screen</Text> };
});
jest.mock('./screens/FinanceDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { FinanceDashboardScreen: () => <Text>finance-dashboard-screen</Text> };
});
jest.mock('./screens/FinanceVerify', () => {
  const { Text } = jest.requireActual('react-native');
  return { FinanceVerifyScreen: () => <Text>finance-verify-screen</Text> };
});
jest.mock('./screens/FinanceReconcile', () => {
  const { Text } = jest.requireActual('react-native');
  return { FinanceReconcileScreen: () => <Text>finance-reconcile-screen</Text> };
});
jest.mock('./screens/PastorDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { PastorDashboardScreen: () => <Text>pastor-dashboard-screen</Text> };
});
jest.mock('./screens/PastorAlerts', () => {
  const { Text } = jest.requireActual('react-native');
  return { PastorAlertsScreen: () => <Text>pastor-alerts-screen</Text> };
});
jest.mock('./screens/PastorClusterBranch', () => {
  const { Text } = jest.requireActual('react-native');
  return { PastorClusterBranchScreen: () => <Text>pastor-cluster-screen</Text> };
});
jest.mock('./screens/UnsupportedDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { UnsupportedDashboardScreen: () => <Text>unsupported-dashboard-screen</Text> };
});

// `[Usher role milestone]` Same one-mock-per-screen pattern as the
// Mobile Personas block above.
jest.mock('./screens/UsherDashboard', () => {
  const { Text } = jest.requireActual('react-native');
  return { UsherDashboardScreen: () => <Text>usher-dashboard-screen</Text> };
});
jest.mock('./screens/UsherAttendance', () => {
  const { Text } = jest.requireActual('react-native');
  return { UsherAttendanceScreen: () => <Text>usher-attendance-screen</Text> };
});
jest.mock('./screens/VisitorIntake', () => {
  const { Text } = jest.requireActual('react-native');
  return { VisitorIntakeScreen: () => <Text>visitor-intake-screen</Text> };
});

function authenticatedAs(actor: { personId: string; role: string; branchId: string; bacentaId?: string; basontaId?: string }) {
  mockedUseAuth.mockReturnValue({
    state: { status: 'authenticated', accessToken: 'token-1', actor },
    devUsers: [],
    loginAsDevUser: jest.fn(),
    logout: jest.fn(),
  });
}

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
    authenticatedAs({ personId: 'p-1', role: 'BACENTA_LEADER', branchId: 'b-1', bacentaId: 'bg-1' });
    render(<App />);
    expect(screen.getByText('dashboard-screen')).toBeTruthy();

    // `[Stewardship gaps sprint]` AppShell's real, unmocked BottomNav -
    // all five Design System §3.2 tabs, Dashboard active by default.
    expect(screen.getByTestId('shepherd-bottom-nav')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(true);
  });

  it('pressing a bottom-tab-bar item switches which screen CurrentScreen renders', () => {
    authenticatedAs({ personId: 'p-1', role: 'BACENTA_LEADER', branchId: 'b-1', bacentaId: 'bg-1' });
    render(<App />);

    fireEvent.press(screen.getByRole('tab', { name: 'Follow-ups' }));

    expect(screen.getByText('follow-up-queue-screen')).toBeTruthy();
    expect(screen.queryByText('dashboard-screen')).toBeNull();
  });

  // `[Mobile Personas sprint]` One "renders the right Dashboard + the
  // right four-tab bar" test per new persona, plus one tab-switch test
  // for each persona's own middle tabs - the same shape as the two
  // Shepherd tests above, now exercised for every role `AppShell.TABS_BY_ROLE`
  // knows about.
  it('renders MinistryDashboardScreen and the Ministry Leader tab bar for BASONTA_LEADER', () => {
    authenticatedAs({ personId: 'p-2', role: 'BASONTA_LEADER', branchId: 'b-1', basontaId: 'bs-1' });
    render(<App />);

    expect(screen.getByText('ministry-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Roster' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Attendance' })).toBeNull();

    fireEvent.press(screen.getByRole('tab', { name: 'Roster' }));
    expect(screen.getByText('ministry-roster-screen')).toBeTruthy();
  });

  it('renders FinanceDashboardScreen and the Finance Officer tab bar for TREASURER', () => {
    authenticatedAs({ personId: 'p-3', role: 'TREASURER', branchId: 'b-1' });
    render(<App />);

    expect(screen.getByText('finance-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Verify' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Reconcile' })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Reconcile' }));
    expect(screen.getByText('finance-reconcile-screen')).toBeTruthy();
  });

  it('renders PastorDashboardScreen and the Resident Pastor tab bar for RESIDENT_PASTOR', () => {
    authenticatedAs({ personId: 'p-4', role: 'RESIDENT_PASTOR', branchId: 'b-1' });
    render(<App />);

    expect(screen.getByText('pastor-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Alerts' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Branch' })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Alerts' }));
    expect(screen.getByText('pastor-alerts-screen')).toBeTruthy();
  });

  it('also renders the Resident Pastor tab bar for ACTING_RESIDENT_PASTOR (Blueprint §8.6 interim authority)', () => {
    authenticatedAs({ personId: 'p-5', role: 'ACTING_RESIDENT_PASTOR', branchId: 'b-1' });
    render(<App />);

    expect(screen.getByText('pastor-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Branch' })).toBeTruthy();
  });

  it('renders UsherDashboardScreen and the Usher tab bar for USHER', () => {
    authenticatedAs({ personId: 'p-7', role: 'USHER', branchId: 'b-1' });
    render(<App />);

    expect(screen.getByText('usher-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Attendance' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Visitor Intake' })).toBeTruthy();

    fireEvent.press(screen.getByRole('tab', { name: 'Visitor Intake' }));
    expect(screen.getByText('visitor-intake-screen')).toBeTruthy();
  });

  it('falls back to UnsupportedDashboardScreen and the two-tab default bar for a role with no built persona', () => {
    authenticatedAs({ personId: 'p-6', role: 'ADMIN', branchId: 'b-1' });
    render(<App />);

    expect(screen.getByText('unsupported-dashboard-screen')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Verify' })).toBeNull();
  });
});
