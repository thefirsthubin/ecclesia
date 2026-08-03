import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ActorContextResponseDto, AuthModeResponseDto, DevLoginResponseDto, DevUserDto } from '@ecclesia/contracts';

import { ApiError, apiGet, apiPost } from '../lib/api-client';
import { CognitoError, getCognitoConfig, globalSignOut, initiateAuth, refreshAuth, respondToMfaChallenge } from './cognito-client';

/**
 * `apps/web-admin`'s authentication state machine — STEP 4, extended by
 * the Development Authentication sprint (STEP 6).
 *
 * States:
 * - `restoring`: initial state while checking `/auth/mode` and
 *   `sessionStorage` for a session left from a previous visit this tab
 *   session.
 * - `unauthenticated`: no valid session; `LoginPage` renders.
 * - `mfa_required`: password verified, awaiting the TOTP code Blueprint
 *   §8.2 makes mandatory for every web-admin persona. Cognito mode only —
 *   development mode has no MFA (STEP 6: "no passwords required in
 *   development mode").
 * - `authenticated`: access token + resolved `ActorContext` (via
 *   `GET /auth/me`, see `AUTH_DESIGN_NOTES.md`) are both available. This
 *   sprint's whole point (STEP 7) is that this state — and everything
 *   downstream of it — cannot tell whether the access token came from
 *   Cognito or the development provider; `fetchActor` is the same call
 *   either way.
 * - `error`: login/session-restore failed; message shown, returns to
 *   `unauthenticated` on next attempt.
 *
 * `[Design Decision]` token storage: access token is held only in this
 * component's React state (never persisted — matches Blueprint §8.3's
 * mobile "in-memory" rule, the more conservative choice to extend to web
 * absent a documented web-specific rule). Cognito's refresh token is
 * stored in `sessionStorage` under `REFRESH_TOKEN_STORAGE_KEY` (cleared
 * when the tab closes; never `localStorage`) — see
 * `APPLICATION_SHELL_DESIGN_NOTES.md` §3 for why this is a disclosed
 * interim choice, not a citation-backed one (no backend session endpoint
 * exists to issue an httpOnly cookie instead).
 *
 * Development Authentication sprint adds a second, deliberately distinct
 * `sessionStorage` key, `DEV_ACCESS_TOKEN_STORAGE_KEY`: a development
 * access token has no refresh flow (`dev-auth.service.ts`'s 12-hour,
 * no-refresh design), so what's persisted across a page reload is the
 * access token itself, not a refresh token — restoring it means calling
 * `GET /auth/me` directly with the stored token and letting a 401 (expiry)
 * fall back to `unauthenticated` the same way an invalid Cognito refresh
 * token already does. Kept as a separate key, not folded into
 * `REFRESH_TOKEN_STORAGE_KEY`, so the two flows can never be confused with
 * each other while reading the code.
 */

const REFRESH_TOKEN_STORAGE_KEY = 'ecclesia.refreshToken';
const DEV_ACCESS_TOKEN_STORAGE_KEY = 'ecclesia.devAccessToken';

export type AuthMode = 'cognito' | 'development';

type AuthState =
  | { status: 'restoring' }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'mfa_required'; email: string; session: string; error?: string }
  | { status: 'authenticated'; accessToken: string; actor: ActorContextResponseDto }
  | { status: 'error'; message: string };

interface AuthContextValue {
  state: AuthState;
  /** `undefined` until `GET /auth/mode` resolves. `LoginPage` treats
   * `undefined` the same as `'cognito'` — defaulting to the always-safe,
   * always-correct-in-production form on any doubt, rather than ever
   * risking rendering the development picker before the mode is actually
   * confirmed (STEP 6: "this UI must never appear in production"). */
  mode: AuthMode | undefined;
  /** Populated only in development mode (`DevAuthController.listUsers()` —
   * empty in cognito mode by construction, since that route doesn't
   * exist there at all). */
  devUsers: DevUserDto[];
  login: (email: string, password: string) => Promise<void>;
  submitMfaCode: (code: string) => Promise<void>;
  /** STEP 6: "select one of the seeded development users... click Sign
   * In... no passwords required." Only ever meaningful when `mode ===
   * 'development'` — calling it in cognito mode would simply 404, since
   * `DevAuthController` doesn't exist in that mode's router at all. */
  loginAsDevUser: (devUserId: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchActor(accessToken: string): Promise<ActorContextResponseDto> {
  return apiGet<ActorContextResponseDto>('/auth/me', { authToken: accessToken });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'restoring' });
  const [mode, setMode] = useState<AuthMode | undefined>(undefined);
  const [devUsers, setDevUsers] = useState<DevUserDto[]>([]);
  // The email address survives an in-flight MFA challenge without being
  // part of the (Cognito-scoped) Session token itself.
  const pendingEmailRef = useRef<string>('');

  useEffect(() => {
    let cancelled = false;

    async function restoreDevelopmentSession(): Promise<void> {
      try {
        const users = await apiGet<DevUserDto[]>('/auth/dev/users');
        if (!cancelled) setDevUsers(users);
      } catch {
        // Best-effort: an empty picker with no seeded users is a valid,
        // clearly-recoverable state (the dev README/guide says to run
        // "pnpm db:seed:dev") — not a reason to block the app from
        // rendering at all.
      }

      const storedDevToken = window.sessionStorage.getItem(DEV_ACCESS_TOKEN_STORAGE_KEY);
      if (storedDevToken) {
        try {
          const actor = await fetchActor(storedDevToken);
          if (!cancelled) setState({ status: 'authenticated', accessToken: storedDevToken, actor });
          return;
        } catch {
          window.sessionStorage.removeItem(DEV_ACCESS_TOKEN_STORAGE_KEY);
        }
      }
      if (!cancelled) setState({ status: 'unauthenticated' });
    }

    async function restoreCognitoSession(): Promise<void> {
      const storedRefreshToken = window.sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (!storedRefreshToken) {
        if (!cancelled) setState({ status: 'unauthenticated' });
        return;
      }
      try {
        const config = getCognitoConfig();
        const result = await refreshAuth(config, storedRefreshToken);
        const actor = await fetchActor(result.AccessToken);
        if (!cancelled) setState({ status: 'authenticated', accessToken: result.AccessToken, actor });
      } catch {
        // Stored refresh token is invalid/expired, or Cognito isn't
        // configured in this environment — either way, fall back to the
        // login screen rather than blocking the app from ever rendering.
        window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        if (!cancelled) setState({ status: 'unauthenticated' });
      }
    }

    async function restore() {
      let resolvedMode: AuthMode = 'cognito';
      try {
        const modeResponse = await apiGet<AuthModeResponseDto>('/auth/mode');
        resolvedMode = modeResponse.mode;
      } catch {
        // The backend is unreachable, or predates this route — fall back
        // to the safe default (`'cognito'`), the same "never risk showing
        // the development picker on any doubt" reasoning as `mode`'s own
        // doc comment above.
      }
      if (cancelled) return;
      setMode(resolvedMode);

      if (resolvedMode === 'development') {
        await restoreDevelopmentSession();
      } else {
        await restoreCognitoSession();
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    pendingEmailRef.current = email;
    try {
      const config = getCognitoConfig();
      const outcome = await initiateAuth(config, email, password);
      if (outcome.kind === 'mfa_required') {
        setState({ status: 'mfa_required', email, session: outcome.session });
        return;
      }
      if (outcome.result.RefreshToken) {
        window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, outcome.result.RefreshToken);
      }
      const actor = await fetchActor(outcome.result.AccessToken);
      setState({ status: 'authenticated', accessToken: outcome.result.AccessToken, actor });
    } catch (error) {
      setState({ status: 'unauthenticated', error: describeAuthError(error) });
    }
  }, []);

  const submitMfaCode = useCallback(
    async (code: string) => {
      if (state.status !== 'mfa_required') {
        throw new Error('submitMfaCode called outside the mfa_required state');
      }
      try {
        const config = getCognitoConfig();
        const result = await respondToMfaChallenge(config, state.email, state.session, code);
        if (result.RefreshToken) {
          window.sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, result.RefreshToken);
        }
        const actor = await fetchActor(result.AccessToken);
        setState({ status: 'authenticated', accessToken: result.AccessToken, actor });
      } catch (error) {
        setState({ status: 'mfa_required', email: state.email, session: state.session, error: describeAuthError(error) });
      }
    },
    [state],
  );

  const loginAsDevUser = useCallback(async (devUserId: string) => {
    try {
      const result = await apiPost<DevLoginResponseDto>('/auth/dev/login', { devUserId });
      window.sessionStorage.setItem(DEV_ACCESS_TOKEN_STORAGE_KEY, result.accessToken);
      const actor = await fetchActor(result.accessToken);
      setState({ status: 'authenticated', accessToken: result.accessToken, actor });
    } catch (error) {
      setState({ status: 'unauthenticated', error: describeDevLoginError(error) });
    }
  }, []);

  const logout = useCallback(async () => {
    if (state.status === 'authenticated') {
      if (mode === 'development') {
        // No Cognito session to sign out of — clearing the stored token
        // below is the entire logout for a development-mode session
        // (`dev-auth.service.ts` issues no refresh/session state
        // server-side to revoke).
        window.sessionStorage.removeItem(DEV_ACCESS_TOKEN_STORAGE_KEY);
      } else {
        try {
          const config = getCognitoConfig();
          await globalSignOut(config, state.accessToken);
        } catch {
          // Best-effort: even if Cognito's own sign-out call fails (e.g.
          // network issue), the client still clears its own session below
          // — an unreachable Cognito shouldn't strand the user in a
          // logged-in UI they can't get out of.
        }
        window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      }
    }
    setState({ status: 'unauthenticated' });
  }, [state, mode]);

  const value = useMemo(
    () => ({ state, mode, devUsers, login, submitMfaCode, loginAsDevUser, logout }),
    [state, mode, devUsers, login, submitMfaCode, loginAsDevUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function describeAuthError(error: unknown): string {
  if (error instanceof CognitoError) {
    // Deliberately generic for credential failures (NotAuthorizedException)
    // — do not confirm/deny whether the email exists, standard login UX
    // practice, not a specific citation.
    if (error.cognitoType.includes('NotAuthorizedException')) {
      return 'Incorrect email or password.';
    }
    if (error.cognitoType.includes('CodeMismatchException')) {
      return 'That code was incorrect. Check your authenticator app and try again.';
    }
    if (error.cognitoType.includes('ExpiredCodeException')) {
      return 'That code expired. Check your authenticator app for a new one.';
    }
    return error.message;
  }
  return 'Something went wrong signing in. Please try again.';
}

function describeDevLoginError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    // Matches DevAuthService.issueTokenFor's own two 404 cases: an
    // unrecognized devUserId (shouldn't happen — LoginPage only offers
    // ids from the same /auth/dev/users list) or a persona that hasn't
    // been seeded yet ("run pnpm db:seed:dev").
    return 'That development user is not available. Run "pnpm db:seed:dev" and reload.';
  }
  return 'Something went wrong signing in. Please try again.';
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
