/**
 * `[Bug fix, Development Authentication sprint]` Pure helper for
 * `main.ts`'s `app.enableCors()` call - see `env.schema.ts`'s
 * `CORS_ORIGIN` field for the full story of why this exists at all (a
 * same-origin-policy block between `apps/web-admin`'s dev server and
 * `apps/api`, discovered live, not something `pnpm lint`/`test`/`build`
 * could ever have caught - it is a browser-only failure mode with no
 * Node-side symptom).
 */

interface CorsEnv {
  CORS_ORIGIN?: string;
  NODE_ENV?: string;
}

/**
 * `undefined` return means "do not call `app.enableCors()` at all" -
 * `main.ts` only calls it when this returns a non-empty array, so
 * production's current behavior (no CORS headers at all) is unchanged
 * for any deployment that hasn't set `CORS_ORIGIN` yet.
 */
export function computeCorsOrigins(env: CorsEnv): string[] | undefined {
  if (env.CORS_ORIGIN) {
    const origins = env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
    if (origins.length > 0) {
      return origins;
    }
    // Whitespace/commas-only counts as "effectively unset", not "no
    // origins allowed" - fall through to the NODE_ENV-based default below
    // rather than silently disabling CORS on what was likely a copy-paste
    // mistake in the environment, not a deliberate choice.
  }

  // Zero-configuration local development: the one origin `apps/web-admin`'s
  // own dev server (`apps/web-admin/project.json`'s `serve` target) is
  // hard-coded to, matching `AUTH_MODE`'s own "development locally"
  // default in `auth-mode.ts`.
  if (env.NODE_ENV === 'development') {
    return ['http://localhost:4200'];
  }

  return undefined;
}
