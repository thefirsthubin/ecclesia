import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { LoginScreen } from './LoginScreen';
import * as authContext from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext');
const mockedUseAuth = authContext.useAuth as jest.Mock;

const DEV_USERS = [
  { id: 'dev-bacenta-leader', label: 'Bacenta Leader (Seeded)', role: 'BACENTA_LEADER' },
  { id: 'dev-resident-pastor', label: 'Resident Pastor (Seeded)', role: 'RESIDENT_PASTOR' },
];

function renderScreen() {
  return render(
    <ThemeProvider>
      <LoginScreen />
    </ThemeProvider>,
  );
}

describe('LoginScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders the development-user picker when devUsers are loaded', () => {
    const loginAsDevUser = jest.fn();
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: DEV_USERS, loginAsDevUser, logout: jest.fn() });

    renderScreen();

    expect(screen.getByText('Bacenta Leader (Seeded)')).toBeTruthy();
    expect(screen.getByText('Resident Pastor (Seeded)')).toBeTruthy();
    // No password/email form anywhere on this screen - Development-Auth-
    // only (AuthContext.tsx's top comment).
    expect(screen.queryByText('Password')).toBeNull();
  });

  it('disables Sign in until a user is selected, then calls loginAsDevUser with the selected id', async () => {
    const loginAsDevUser = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: DEV_USERS, loginAsDevUser, logout: jest.fn() });

    renderScreen();

    const signInButton = screen.getByTestId('login-sign-in');
    expect(signInButton.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByText('Resident Pastor (Seeded)'));
    expect(signInButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(signInButton);
    // handleSignIn awaits loginAsDevUser before its own setSubmitting(false)
    // - waitFor here lets that state update settle inside act() before the
    // test ends, instead of it landing after teardown.
    await waitFor(() => expect(loginAsDevUser).toHaveBeenCalledWith('dev-resident-pastor'));
  });

  it('shows the seed-data empty state when no development users are seeded yet', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });

    renderScreen();

    expect(screen.getByText('No development users seeded')).toBeTruthy();
  });

  it('shows an explanatory EmptyState (no login form at all) when the API is in cognito mode', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unsupported', mode: 'cognito' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });

    renderScreen();

    expect(screen.getByText("Sign-in isn't available")).toBeTruthy();
    expect(screen.queryByTestId('login-sign-in')).toBeNull();
  });

  it('surfaces a loginAsDevUser error message', () => {
    mockedUseAuth.mockReturnValue({
      state: { status: 'unauthenticated', error: 'That development user is not available. Run "pnpm db:seed:dev" and reload.' },
      devUsers: DEV_USERS,
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });

    renderScreen();

    expect(screen.getByText(/pnpm db:seed:dev/)).toBeTruthy();
  });
});
