import { CognitoError, getCognitoConfig, globalSignOut, initiateAuth, refreshAuth, respondToMfaChallenge } from './cognito-client';

const CONFIG = { region: 'us-east-1', clientId: 'client-123' };

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe('getCognitoConfig', () => {
  afterEach(() => {
    window.__ECCLESIA_CONFIG__ = undefined;
  });

  it('throws a clear error when runtime config is missing', () => {
    window.__ECCLESIA_CONFIG__ = undefined;
    expect(() => getCognitoConfig()).toThrow(/Cognito is not configured/);
  });

  it('reads region/clientId from window.__ECCLESIA_CONFIG__', () => {
    window.__ECCLESIA_CONFIG__ = { cognitoRegion: 'eu-west-1', cognitoClientId: 'abc' };
    expect(getCognitoConfig()).toEqual({ region: 'eu-west-1', clientId: 'abc' });
  });
});

describe('initiateAuth', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns an authenticated outcome when Cognito returns a direct AuthenticationResult', async () => {
    mockFetchOnce(200, { AuthenticationResult: { AccessToken: 'a', IdToken: 'i', RefreshToken: 'r', ExpiresIn: 900 } });

    const outcome = await initiateAuth(CONFIG, 'pastor@example.com', 'hunter2');

    expect(outcome).toEqual({ kind: 'authenticated', result: { AccessToken: 'a', IdToken: 'i', RefreshToken: 'r', ExpiresIn: 900 } });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cognito-idp.us-east-1.amazonaws.com/',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth' }),
      }),
    );
  });

  it('returns an mfa_required outcome on a SOFTWARE_TOKEN_MFA challenge', async () => {
    mockFetchOnce(200, { ChallengeName: 'SOFTWARE_TOKEN_MFA', Session: 'session-token' });

    const outcome = await initiateAuth(CONFIG, 'pastor@example.com', 'hunter2');

    expect(outcome).toEqual({ kind: 'mfa_required', session: 'session-token' });
  });

  it('throws CognitoError on a non-2xx response', async () => {
    mockFetchOnce(400, { __type: 'NotAuthorizedException', message: 'Incorrect username or password.' });

    await expect(initiateAuth(CONFIG, 'pastor@example.com', 'wrong')).rejects.toThrow(CognitoError);
  });
});

describe('respondToMfaChallenge', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns the AuthenticationResult on success', async () => {
    mockFetchOnce(200, { AuthenticationResult: { AccessToken: 'a', IdToken: 'i', ExpiresIn: 900 } });

    const result = await respondToMfaChallenge(CONFIG, 'pastor@example.com', 'session-token', '123456');

    expect(result.AccessToken).toBe('a');
  });
});

describe('refreshAuth', () => {
  afterEach(() => jest.resetAllMocks());

  it('returns the AuthenticationResult on success', async () => {
    mockFetchOnce(200, { AuthenticationResult: { AccessToken: 'a2', IdToken: 'i2', ExpiresIn: 900 } });

    const result = await refreshAuth(CONFIG, 'refresh-token');

    expect(result.AccessToken).toBe('a2');
  });

  it('throws when Cognito responds without an AuthenticationResult', async () => {
    mockFetchOnce(200, {});
    await expect(refreshAuth(CONFIG, 'refresh-token')).rejects.toThrow();
  });
});

describe('globalSignOut', () => {
  afterEach(() => jest.resetAllMocks());

  it('POSTs GlobalSignOut with the access token', async () => {
    mockFetchOnce(200, {});
    await globalSignOut(CONFIG, 'access-token');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://cognito-idp.us-east-1.amazonaws.com/',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut' }),
      }),
    );
  });
});
