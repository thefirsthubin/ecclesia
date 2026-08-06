import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ActorContextResponseDto, AuthModeResponseDto, DevLoginResponseDto, DevUserDto } from '@ecclesia/contracts';

import { ApiError, apiGet, apiPost } from '../lib/api-client';

/**
 * `apps/mobile`'s authentication state machine — Mobile Application Shell
 * sprint. Deliberately **Development-Auth-only**: Blueprint §8.3's
 * Shepherd phone-number + OTP authentication method has never been built
 * anywhere in this codebase (no phone/OTP provider, no
 * `PhoneAuthController`, nothing — confirmed by grep across
 * `apps/api/src/platform/auth` during this sprint's research step), so
 * this app cannot log a Shepherd in the way Blueprint §8.3 ultimately
 * specifies. What it *can* do is reuse the same `/auth/dev/*` routes
 * `apps/web-admin` uses in development (Development Authentication
 * sprint) — the identical backend contract, a different picker UI.
 *
 * This is a disclosed, real gap, not a silent substitution: `state`'s
 * `'unsupported'` member below is what this app shows if it's ever
 * pointed at an API running in Cognito mode (`GET /auth/mode` resolves to
 * `'cognito'`) — there is no Cognito *or* phone/OTP UI in this app for
 * that case to fall back to, and pretending otherwise would be worse than
 * telling the Shepherd plainly that mobile sign-in isn't available yet in
 * that environment.
 *
 * `[Design Decision]` Token storage: in-memory `useState` only, with **no
 * persistence** across an app restart/kill — RN's own storage story is a
 * disclosed gap in this workspace (no `AsyncStorage`/`SecureStore`
 * dependency exists in `package.json`, and this sandbox has no
 * package-registry network access to add one). `apps/web-admin`'s own
 * `AuthContext.tsx` persists its development access token in
 * `sessionStorage`, a web-only API with no RN equivalent — this is the
 * one real behavioral difference from that file, not an oversight. A
 * future sprint that adds a secure-storage dependency is what closes this
 * gap; until then, every app restart returns to the login screen, which
 * is the safe (not silently-broken) failure mode.
 */

export type AuthMode = 'cognito' | 'development';

type AuthState =
  | { status: 'restoring' }
  | { status: 'unsupported'; mode: AuthMode }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'authenticated'; accessToken: string; actor: ActorContextResponseDto };

interface AuthContextValue {
  state: AuthState;
  /** Populated only once `GET /auth/dev/users` resolves in development
   * mode — mirrors `apps/web-admin`'s `AuthContext.devUsers` exactly. */
  devUsers: DevUserDto[];
  loginAsDevUser: (devUserId: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchActor(accessToken: string): Promise<ActorContextResponseDto> {
  return apiGet<ActorContextResponseDto>('/auth/me', { authToken: accessToken });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'restoring' });
  const [devUsers, setDevUsers] = useState<DevUserDto[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      let resolvedMode: AuthMode = 'cognito';
      try {
        const modeResponse = await apiGet<AuthModeResponseDto>('/auth/mode');
        resolvedMode = modeResponse.mode;
      } catch {
        // Backend unreachable, or predates /auth/mode — same "assume the
        // safe/least-capable state" fallback as apps/web-admin's own
        // restore effect, which here means 'cognito' (this app has no UI
        // for it, so the result is 'unsupported' below either way).
      }
      if (cancelled) return;

      if (resolvedMode !== 'development') {
        setState({ status: 'unsupported', mode: resolvedMode });
        return;
      }

      try {
        const users = await apiGet<DevUserDto[]>('/auth/dev/users');
        if (!cancelled) setDevUsers(users);
      } catch {
        // Best-effort, matches apps/web-admin: an empty picker ("run pnpm
        // db:seed:dev") is a valid, recoverable state.
      }
      // No stored token to restore (see the in-memory-only note above) —
      // every boot starts at the login screen in development mode.
      if (!cancelled) setState({ status: 'unauthenticated' });
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginAsDevUser = useCallback(async (devUserId: string) => {
    try {
      const result = await apiPost<DevLoginResponseDto>('/auth/dev/login', { devUserId });
      const actor = await fetchActor(result.accessToken);
      setState({ status: 'authenticated', accessToken: result.accessToken, actor });
    } catch (error) {
      setState({ status: 'unauthenticated', error: describeDevLoginError(error) });
    }
  }, []);

  const logout = useCallback(() => {
    setState({ status: 'unauthenticated' });
  }, []);

  const value = useMemo(() => ({ state, devUsers, loginAsDevUser, logout }), [state, devUsers, loginAsDevUser, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function describeDevLoginError(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    // Mirrors apps/web-admin's own describeDevLoginError — same backend,
    // same two 404 cases (DevAuthService.issueTokenFor).
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
