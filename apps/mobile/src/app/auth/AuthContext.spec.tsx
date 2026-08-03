import { Text } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AuthProvider, useAuth } from './AuthContext';
import * as apiClient from '../lib/api-client';

// Keep the real `ApiError` class (its constructor sets `status` - a full
// automock replaces the constructor with a no-op mock and leaves that
// field unset, which would make `describeDevLoginError`'s `error
// instanceof ApiError && error.status === 404` check fail even for a
// genuine 404) while mocking every function - same technique as
// `apps/web-admin`'s own `AuthContext.spec.tsx` uses for `CognitoError`.
jest.mock('../lib/api-client', () => ({
  ...jest.requireActual('../lib/api-client'),
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));
const mockedApi = apiClient as jest.Mocked<typeof apiClient>;

const ACTOR = { personId: 'person-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' };
const DEV_USERS = [{ id: 'dev-bacenta-leader', label: 'Bacenta Leader (Seeded)', role: 'BACENTA_LEADER' }];

// `@testing-library/react-native`'s auto-registered matchers (v12+, see
// `test-setup.ts`) don't include `toHaveTextContent` - reading a `Text`
// node's rendered string back via its own `children` prop is this
// workspace's RN-side substitute (mirrors `navigation/Navigator.spec.tsx`'s
// own `textOf` helper).
function textOf(testId: string): string {
  return String(screen.getByTestId(testId).props.children);
}

function Probe() {
  const { state, devUsers, loginAsDevUser, logout } = useAuth();
  return (
    <>
      <Text testID="status">{state.status}</Text>
      <Text testID="dev-user-count">{devUsers.length}</Text>
      {state.status === 'unauthenticated' && state.error && <Text testID="error">{state.error}</Text>}
      {state.status === 'authenticated' && <Text testID="role">{state.actor.role}</Text>}
      {state.status === 'unsupported' && <Text testID="unsupported-mode">{state.mode}</Text>}
      <Text testID="login-as-dev" onPress={() => void loginAsDevUser('dev-bacenta-leader')}>
        login-as-dev
      </Text>
      <Text testID="logout" onPress={() => logout()}>
        logout
      </Text>
    </>
  );
}

describe('AuthProvider (Mobile, Development-Auth-only)', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('resolves to unauthenticated (with dev users loaded) when the API is in development mode', async () => {
    mockedApi.apiGet.mockImplementation((path: string) => {
      if (path === '/auth/mode') return Promise.resolve({ mode: 'development' } as never);
      if (path === '/auth/dev/users') return Promise.resolve(DEV_USERS as never);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(textOf('status')).toBe('unauthenticated'));
    expect(textOf('dev-user-count')).toBe('1');
  });

  it('resolves to unsupported when the API is in cognito mode - this app has no Cognito/phone+OTP UI to fall back to', async () => {
    mockedApi.apiGet.mockImplementation((path: string) => {
      if (path === '/auth/mode') return Promise.resolve({ mode: 'cognito' } as never);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(textOf('status')).toBe('unsupported'));
    expect(textOf('unsupported-mode')).toBe('cognito');
  });

  it('moves to authenticated after loginAsDevUser resolves, populating the actor from GET /auth/me', async () => {
    mockedApi.apiGet.mockImplementation((path: string) => {
      if (path === '/auth/mode') return Promise.resolve({ mode: 'development' } as never);
      if (path === '/auth/dev/users') return Promise.resolve(DEV_USERS as never);
      if (path === '/auth/me') return Promise.resolve(ACTOR as never);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });
    mockedApi.apiPost.mockResolvedValue({ accessToken: 'dev-token-1', expiresIn: 43200 } as never);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(textOf('status')).toBe('unauthenticated'));

    fireEvent.press(screen.getByTestId('login-as-dev'));

    await waitFor(() => expect(textOf('status')).toBe('authenticated'));
    expect(textOf('role')).toBe('BACENTA_LEADER');
    // AuthContext.tsx calls apiPost with only 2 args (path, body) - the
    // 3rd `options` argument is a default parameter on the real apiPost,
    // never actually passed by the caller, so it never shows up as an arg
    // the mock recorded either.
    expect(mockedApi.apiPost).toHaveBeenCalledWith('/auth/dev/login', { devUserId: 'dev-bacenta-leader' });

    fireEvent.press(screen.getByTestId('logout'));
    await waitFor(() => expect(textOf('status')).toBe('unauthenticated'));
  });

  it('surfaces a friendly error and stays unauthenticated when the dev user is not seeded (404)', async () => {
    mockedApi.apiGet.mockImplementation((path: string) => {
      if (path === '/auth/mode') return Promise.resolve({ mode: 'development' } as never);
      if (path === '/auth/dev/users') return Promise.resolve(DEV_USERS as never);
      return Promise.reject(new Error(`unexpected path ${path}`));
    });
    mockedApi.apiPost.mockRejectedValue(new apiClient.ApiError('not found', 404));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(textOf('status')).toBe('unauthenticated'));

    fireEvent.press(screen.getByTestId('login-as-dev'));

    await waitFor(() => expect(textOf('error')).toMatch(/pnpm db:seed:dev/));
  });
});
