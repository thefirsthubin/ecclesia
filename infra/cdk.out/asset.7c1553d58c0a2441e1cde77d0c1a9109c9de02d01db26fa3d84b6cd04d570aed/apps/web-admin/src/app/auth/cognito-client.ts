/**
 * A minimal Cognito Identity Provider client built on raw `fetch`.
 *
 * [Design Decision] No Cognito client SDK (`aws-amplify`,
 * `amazon-cognito-identity-js`) is installed, and none can be added in
 * this sandbox (no package-registry network access — see
 * `APPLICATION_SHELL_DESIGN_NOTES.md` §0). Cognito's `InitiateAuth` /
 * `RespondToAuthChallenge` / `GlobalSignOut` operations are a public,
 * documented JSON API (`AWSCognitoIdentityProviderService`) — every SDK is
 * itself a thin wrapper over exactly these calls, so this file makes them
 * directly, the same way `apps/mobile`'s `api-client.ts` already makes
 * plain-`fetch` calls to `apps/api` instead of pulling in an HTTP client.
 *
 * Blueprint §8.2: Web Admin's primary personas (Treasurer, Assistant
 * Pastor, Resident Pastor, Admin) authenticate with email + password and
 * **mandatory** TOTP MFA — so `initiateAuth` always expects either an
 * immediate `AuthenticationResult` (already-verified device, rare) or a
 * `SOFTWARE_TOKEN_MFA` challenge (the documented default case) back.
 */

export interface CognitoConfig {
  region: string;
  clientId: string;
}

/**
 * `COGNITO_CLIENT_ID` / `COGNITO_REGION` are public OAuth client
 * identifiers (not secrets — the same values a mobile app or SPA would
 * ship in its bundle), already defined server-side in
 * `apps/api/src/platform/config/env.schema.ts`. There is no build-time env
 * injection wired up for `apps/web-admin` yet (no `.env`/webpack
 * `DefinePlugin` entry) — that is a real, disclosed gap: until one exists,
 * `getCognitoConfig()` reads `window.__ECCLESIA_CONFIG__`, a small
 * runtime-config object a deployed index.html would set (a common static-
 * SPA pattern, since a build-time env var can't differ across
 * environments off one built bundle), and throws a clear error otherwise
 * rather than silently pointing at a fake pool.
 */
export function getCognitoConfig(): CognitoConfig {
  const runtimeConfig = typeof window !== 'undefined' ? window.__ECCLESIA_CONFIG__ : undefined;
  if (!runtimeConfig?.cognitoRegion || !runtimeConfig?.cognitoClientId) {
    throw new Error(
      'Cognito is not configured: window.__ECCLESIA_CONFIG__.cognitoRegion/cognitoClientId are missing. ' +
        'See APPLICATION_SHELL_DESIGN_NOTES.md §3 for how this is meant to be provided at deploy time.',
    );
  }
  return { region: runtimeConfig.cognitoRegion, clientId: runtimeConfig.cognitoClientId };
}

export class CognitoError extends Error {
  constructor(
    public readonly cognitoType: string,
    message: string,
  ) {
    super(message);
    this.name = 'CognitoError';
  }
}

interface AuthenticationResult {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
  ExpiresIn: number;
}

interface InitiateAuthResponse {
  AuthenticationResult?: AuthenticationResult;
  ChallengeName?: string;
  Session?: string;
}

async function callCognito<T>(config: CognitoConfig, target: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`https://cognito-idp.${config.region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new CognitoError(data.__type ?? 'UnknownError', data.message ?? 'Cognito request failed');
  }
  return data as T;
}

export type InitiateAuthOutcome =
  | { kind: 'authenticated'; result: AuthenticationResult }
  | { kind: 'mfa_required'; session: string };

export async function initiateAuth(config: CognitoConfig, email: string, password: string): Promise<InitiateAuthOutcome> {
  const response = await callCognito<InitiateAuthResponse>(config, 'InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: config.clientId,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });

  if (response.AuthenticationResult) {
    return { kind: 'authenticated', result: response.AuthenticationResult };
  }
  if (response.ChallengeName === 'SOFTWARE_TOKEN_MFA' && response.Session) {
    return { kind: 'mfa_required', session: response.Session };
  }
  throw new Error(`Unexpected InitiateAuth response: unhandled challenge "${response.ChallengeName ?? 'none'}"`);
}

export async function respondToMfaChallenge(
  config: CognitoConfig,
  email: string,
  session: string,
  code: string,
): Promise<AuthenticationResult> {
  const response = await callCognito<InitiateAuthResponse>(config, 'RespondToAuthChallenge', {
    ChallengeName: 'SOFTWARE_TOKEN_MFA',
    ClientId: config.clientId,
    Session: session,
    ChallengeResponses: { USERNAME: email, SOFTWARE_TOKEN_MFA_CODE: code },
  });

  if (!response.AuthenticationResult) {
    throw new Error('RespondToAuthChallenge did not return an AuthenticationResult');
  }
  return response.AuthenticationResult;
}

export async function refreshAuth(config: CognitoConfig, refreshToken: string): Promise<AuthenticationResult> {
  const response = await callCognito<InitiateAuthResponse>(config, 'InitiateAuth', {
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    ClientId: config.clientId,
    AuthParameters: { REFRESH_TOKEN: refreshToken },
  });

  if (!response.AuthenticationResult) {
    throw new Error('REFRESH_TOKEN_AUTH did not return an AuthenticationResult');
  }
  return response.AuthenticationResult;
}

export async function globalSignOut(config: CognitoConfig, accessToken: string): Promise<void> {
  await callCognito(config, 'GlobalSignOut', { AccessToken: accessToken });
}
