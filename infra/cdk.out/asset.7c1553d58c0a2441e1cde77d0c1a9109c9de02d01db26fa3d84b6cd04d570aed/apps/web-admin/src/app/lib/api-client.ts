/**
 * Minimal typed `fetch` wrapper for `apps/api`, mirroring
 * `apps/mobile/src/app/lib/api-client.ts`'s own reasoning (same doc
 * comment there on why no HTTP client library is used) — kept as a
 * near-duplicate rather than a shared `libs/ui` helper since the two
 * platforms' auth-token sourcing differs enough (in-memory React context
 * here vs. a stub `useSession()` there) that a shared abstraction would be
 * premature.
 *
 * `API_BASE_URL` is `[Design Decision]`, same placeholder reasoning as
 * mobile's.
 *
 * `[Bug fix, Development Authentication sprint]` Includes the `/v1` prefix
 * `main.ts`'s `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`
 * requires of every non-`VERSION_NEUTRAL` route (every route except
 * `HealthController`'s) — every call this client made before this fix
 * (`GET /auth/me`, every domain page's list/detail fetch) was silently
 * 404ing against a real running backend, since none of them ever reached
 * `/v1/...`. This went unnoticed until this sprint because no earlier
 * sprint had a way to run the API against a real, authenticated session
 * end-to-end (see DEVELOPMENT_AUTHENTICATION_GUIDE.md) — every prior
 * frontend sprint validated against contract-shaped mocks in tests, never
 * a live backend.
 */
export const API_BASE_URL = 'http://localhost:3000/v1';

/**
 * `[People Intake milestone]` `body` carries the parsed JSON response body
 * when the server returned one (every error response this backend sends is
 * a JSON object - see `HttpExceptionFilter`/Nest's default), `undefined`
 * when the response had no body or wasn't valid JSON (e.g. a network-layer
 * failure the fetch itself never turned into a Response). This is what lets
 * a 409 from `POST /people` (`ConflictException({ message, candidates })`,
 * see `PersonService.create`) be read as a duplicate-candidate list instead
 * of only a generic status code - no prior sprint's flow needed this, since
 * nothing before the People Intake milestone read a structured error body.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Best-effort JSON parse of a failed response's body - swallows parse
 * failures (empty body, non-JSON body) rather than letting them mask the
 * real `ApiError` with an unrelated `SyntaxError`. */
async function readErrorBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export interface ApiGetOptions {
  authToken?: string;
  signal?: AbortSignal;
}

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { headers, signal: options.signal });
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status, await readErrorBody(response));
  }
  return (await response.json()) as T;
}

export interface ApiPatchOptions {
  authToken?: string;
  signal?: AbortSignal;
}

export async function apiPatch<T>(path: string, body: unknown, options: ApiPatchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (options.authToken) {
    headers.Authorization = `Bearer ${options.authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });
  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status, await readErrorBody(response));
  }
  return (await response.json()) as T;
}

export interface ApiPostOptions {
  authToken?: string;
  signal?: AbortSignal;
}

/** Added in the Stewardship Web Admin sprint - the first web-admin page to
 * need `POST` for an existing-resource action (`verify`/`flag`/`escalate`/
 * `reconcile`/`approve`/`reject`/`pay`; the Financial Transaction and
 * Expense controllers use `POST`, not `PATCH`, for these transitions -
 * see their own doc comments). Otherwise an exact mirror of `apiPatch`. */
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
    throw new ApiError(`Request to ${path} failed with status ${response.status}`, response.status, await readErrorBody(response));
  }
  return (await response.json()) as T;
}
