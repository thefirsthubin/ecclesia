/**
 * Minimal typed `fetch` wrapper for `apps/api`. No HTTP client library
 * (axios, etc.) exists anywhere in this workspace's `package.json` yet —
 * `fetch` is available natively in the React Native runtime this app
 * targets, so this file adds no new dependency for what is, this sprint,
 * a small set of `GET`/`POST` calls. See `SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 5's "Caching" note: there is deliberately no request-caching layer
 * here either — a future sprint's concern, not silently invented now.
 *
 * `API_BASE_URL` is `[Design Decision]`: no environment-configuration
 * convention for the mobile app's API origin exists yet anywhere in this
 * codebase (`libs/config` covers the *backend's* env schema, not a
 * client-side one) — this constant is a placeholder a real deployment
 * would replace with a build-time env value.
 *
 * `[Bug fix, Mobile Shell + Attendance Capture sprint]` Includes the `/v1`
 * prefix `apps/api/src/main.ts`'s `app.enableVersioning({ type:
 * VersioningType.URI, defaultVersion: '1' })` requires of every route
 * except `HealthController`'s — the same gap `apps/web-admin`'s own
 * `api-client.ts` had until the Development Authentication sprint found
 * and fixed it there. Never noticed here before now because `apps/mobile`
 * had no real auth wiring to reach an authenticated endpoint with until
 * this sprint either.
 */
export const API_BASE_URL = 'http://localhost:3000/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiGetOptions {
  authToken?: string;
  signal?: AbortSignal;
}

/**
 * Issues a `GET` request and parses the JSON response. Throws `ApiError`
 * on any non-2xx response so calling hooks can distinguish "the request
 * failed" from "the request succeeded with an empty/zero result" — the
 * distinction each card's `Skeleton`/`ErrorState`/`EmptyState` split
 * (STEP 7) depends on.
 */
export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers, signal: options.signal });
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}

export interface ApiPostOptions {
  authToken?: string;
  signal?: AbortSignal;
}

/**
 * `[Mobile Shell + Attendance Capture sprint]` This app's first `POST`
 * support — everything before this sprint (the Shepherd Dashboard) was
 * read-only. Mirrors `apps/web-admin`'s own `apiPost` exactly (same
 * header/error-handling shape), kept as a near-duplicate rather than a
 * shared `libs/ui`/`libs/testing` helper for the same reason
 * `api-client.ts`'s own top comment already gives for not sharing `apiGet`
 * across platforms: the two apps' auth-token sourcing differs enough that
 * a shared abstraction would be premature.
 */
export async function apiPost<T>(path: string, body: unknown, options: ApiPostOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status);
  }
  return (await response.json()) as T;
}
