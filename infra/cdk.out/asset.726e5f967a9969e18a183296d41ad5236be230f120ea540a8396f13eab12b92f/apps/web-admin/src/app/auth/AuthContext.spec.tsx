import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { AuthProvider, useAuth } from './AuthContext';
import * as cognitoClient from './cognito-client';
import * as apiClient from '../lib/api-client';

// Keep the real `CognitoError` class (its constructor sets
// `cognitoType`/`message`, which `AuthContext.describeAuthError` reads via
// `instanceof` - a full automock would replace the constructor with a
// no-op mock and leave those fields unset) while mocking every function.
jest.mock('./cognito-client', () => ({
  ...jest.requireActual('./cognito-client'),
  getCognitoConfig: jest.fn(),
  initiateAuth: jest.fn(),
  respondToMfaChallenge: jest.fn(),
  refreshAuth: jest.fn(),
  globalSignOut: jest.fn(),
}));
jest.mock('../lib/api-client');

const mockedCognito = cognitoClient as jest.Mocked<typeof cognitoClient>;
const mockedApi = apiClient as jest.Mocked<typeof apiClient>;

const ACTOR = { personId: 'person-1', role: 'RESIDENT_PASTOR', branchId: 'branch-1' };

function Probe() {
  const { state, mode, devUsers, login, submitMfaCode, loginAsDevUser, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="mode">{mode ?? ''}</span>
      <span data-testid="dev-user-count">{devUsers.length}</span>
      {state.status === 'unauthenticated' && state.error && <span data-testid="error">{state.error}</span>}
      {state.status === 'authenticated' && <span data-testid="role">{state.actor.role}</span>}
      <button onClick={() => void login('pastor@example.com', 'hunter2')}>login</button>
      <button onClick={() => void submitMfaCode('123456')}>submit-mfa</button>
      <button onClick={() => void loginAsDevUser('dev-resident-pastor')}>login-as-dev</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

beforeEach(() => {
  window.sessionStorage.clear();
  window.__ECCLESIA_CONFIG__ = { cognitoRegion: 'us-east-1', cognitoClientId: 'client-123' };
  mockedCognito.getCognitoConfig.mockReturnValue({ region: 'us-east-1', clientId: 'client-123' });
  mockedApi.apiGet.mockResolvedValue(ACTOR as never);
});

afterEach(() => {
  jest.resetAllMocks();
  window.__ECCLESIA_CONFIG__ = undefined;
});

describe('AuthProvider', () => {
  it('starts in unauthenticated state when no refresh token is stored', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
  });

  it('goes straight to authenticated when Cognito returns an AuthenticationResult directly', async () => {
    mockedCognito.initiateAuth.mockResolvedValue({
      kind: 'authenticated',
      result: { AccessToken: 'access-1', IdToken: 'id-1', RefreshToken: 'refresh-1', ExpiresIn: 900 },
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));

    fireEvent.click(screen.getByText('login'));

    // A plain-string match here would also match "unauthenticated" (it's a
    // substring) - anchored regex to require an exact match.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));
    expect(screen.getByTestId('role')).toHaveTextContent('RESIDENT_PASTOR');
    expect(window.sessionStorage.getItem('ecclesia.refreshToken')).toBe('refresh-1');
  });

  it('moves to mfa_required and then authenticated after a valid code (Blueprint §8.2 mandatory MFA)', async () => {
    mockedCognito.initiateAuth.mockResolvedValue({ kind: 'mfa_required', session: 'session-token' });
    mockedCognito.respondToMfaChallenge.mockResolvedValue({
      AccessToken: 'access-2',
      IdToken: 'id-2',
      RefreshToken: 'refresh-2',
      ExpiresIn: 900,
    });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));

    fireEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('mfa_required'));

    fireEvent.click(screen.getByText('submit-mfa'));
    // A plain-string match here would also match "unauthenticated" (it's a
    // substring) - anchored regex to require an exact match.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));
  });

  it('surfaces a friendly message on incorrect credentials without confirming which field was wrong', async () => {
    mockedCognito.initiateAuth.mockRejectedValue(new cognitoClient.CognitoError('NotAuthorizedException', 'Incorrect username or password.'));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));

    fireEvent.click(screen.getByText('login'));

    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Incorrect email or password.'));
  });

  it('logout clears the refresh token and returns to unauthenticated', async () => {
    mockedCognito.initiateAuth.mockResolvedValue({
      kind: 'authenticated',
      result: { AccessToken: 'access-1', IdToken: 'id-1', RefreshToken: 'refresh-1', ExpiresIn: 900 },
    });
    mockedCognito.globalSignOut.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    fireEvent.click(screen.getByText('login'));
    // A plain-string match here would also match "unauthenticated" (it's a
    // substring) - anchored regex to require an exact match.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(window.sessionStorage.getItem('ecclesia.refreshToken')).toBeNull();
  });

  it('restores a session from a stored refresh token on mount', async () => {
    window.sessionStorage.setItem('ecclesia.refreshToken', 'stored-refresh');
    mockedCognito.refreshAuth.mockResolvedValue({ AccessToken: 'access-3', IdToken: 'id-3', ExpiresIn: 900 });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    // A plain-string match here would also match "unauthenticated" (it's a
    // substring) - anchored regex to require an exact match.
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));
  });
});

/**
 * Development Authentication sprint (STEP 6/7). `apiGet` is mocked
 * per-path here (rather than the blanket `mockResolvedValue` the cognito
 * suite above uses) since these tests need `/auth/mode` and
 * `/auth/dev/users` to resolve to genuinely different shapes than
 * `/auth/me`.
 */
describe('AuthProvider — development mode', () => {
  const DEV_USERS = [{ id: 'dev-resident-pastor', label: 'Resident Pastor', role: 'RESIDENT_PASTOR' }];

  function mockDevBackend(overrides: { devUsers?: typeof DEV_USERS; actor?: unknown } = {}) {
    mockedApi.apiGet.mockImplementation((path: string) => {
      if (path === '/auth/mode') return Promise.resolve({ mode: 'development' });
      if (path === '/auth/dev/users') return Promise.resolve(overrides.devUsers ?? DEV_USERS);
      if (path === '/auth/me') return Promise.resolve(overrides.actor ?? ACTOR);
      return Promise.reject(new Error(`unexpected apiGet path in test: ${path}`));
    });
  }

  it('resolves mode=development and populates the seeded user roster', async () => {
    mockDevBackend();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('development'));
    expect(screen.getByTestId('dev-user-count')).toHaveTextContent('1');
    // No stored dev token yet, so restore lands on unauthenticated (the
    // picker) rather than skipping straight to authenticated.
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
  });

  it('logs in as a selected development user with no password/MFA step', async () => {
    mockDevBackend();
    mockedApi.apiPost.mockResolvedValue({ accessToken: 'dev-token-1', expiresIn: 43200 });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('development'));

    fireEvent.click(screen.getByText('login-as-dev'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));
    expect(mockedApi.apiPost).toHaveBeenCalledWith('/auth/dev/login', { devUserId: 'dev-resident-pastor' });
    expect(window.sessionStorage.getItem('ecclesia.devAccessToken')).toBe('dev-token-1');
  });

  it('restores an authenticated session from a stored development access token on mount', async () => {
    window.sessionStorage.setItem('ecclesia.devAccessToken', 'stored-dev-token');
    mockDevBackend();

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));
  });

  it('logout clears the development token and returns to unauthenticated without calling Cognito sign-out', async () => {
    mockDevBackend();
    mockedApi.apiPost.mockResolvedValue({ accessToken: 'dev-token-2', expiresIn: 43200 });

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('mode')).toHaveTextContent('development'));
    fireEvent.click(screen.getByText('login-as-dev'));
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent(/^authenticated$/));

    fireEvent.click(screen.getByText('logout'));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(window.sessionStorage.getItem('ecclesia.devAccessToken')).toBeNull();
    expect(mockedCognito.globalSignOut).not.toHaveBeenCalled();
  });
});
