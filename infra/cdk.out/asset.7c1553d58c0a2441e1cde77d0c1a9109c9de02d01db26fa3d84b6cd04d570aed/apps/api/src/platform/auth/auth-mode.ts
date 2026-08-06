/**
 * Development Authentication sprint. Single source of truth for which
 * identity provider `AuthModule` wires up: real AWS Cognito (production,
 * and the only mode ever intended to run against real church data) or the
 * local Development Identity Provider (STEP 2-3 of the sprint brief -
 * `apps/api/src/platform/auth/DEVELOPMENT_AUTHENTICATION_GUIDE.md` has the
 * full writeup).
 *
 * Read alongside `env.schema.ts`'s `AUTH_MODE` field and `auth.module.ts`'s
 * conditional provider wiring - both call into this one file rather than
 * each re-implementing the same "which mode, and is it safe" logic.
 */

export type AuthMode = 'cognito' | 'development';

interface AuthModeEnv {
  AUTH_MODE?: string;
  NODE_ENV?: string;
}

/**
 * Pure - never throws. `AUTH_MODE` is authoritative when set to one of the
 * two recognized values; otherwise the mode is inferred from `NODE_ENV`
 * (STEP 5's "Default: development locally, cognito in production"):
 * `NODE_ENV=development` -> `development`, everything else (`test`,
 * `production`, or unset) -> the safe default, `cognito`.
 */
export function computeAuthMode(env: AuthModeEnv): AuthMode {
  if (env.AUTH_MODE === 'development' || env.AUTH_MODE === 'cognito') {
    return env.AUTH_MODE;
  }
  return env.NODE_ENV === 'development' ? 'development' : 'cognito';
}

/**
 * Computes the effective mode via `computeAuthMode`, then enforces the
 * one hard safety rule the sprint brief calls out explicitly: "impossible
 * to activate accidentally in production." A literal reading of the
 * brief's STEP 2 ("activate when NODE_ENV=development OR AUTH_MODE=development")
 * would let an operator who leaves a stray `AUTH_MODE=development` in a
 * production deploy's environment accidentally boot the development
 * provider in production - exactly the outcome the brief's own
 * "Production Acceptance Criteria" section forbids. This function closes
 * that gap: `AUTH_MODE=development` is only ever honored when
 * `NODE_ENV` is *not* `production`. If both are set to the unsafe
 * combination, the process refuses to boot with a clear error - the same
 * "fail fast on misconfiguration" precedent `env.schema.ts` already
 * applies to `DATABASE_URL`/`COGNITO_*`.
 *
 * Called once, at the one place a hard failure is appropriate:
 * `auth.module.ts`'s provider wiring, which runs at process bootstrap.
 * `env.schema.ts`'s own validation surfaces the identical check as a
 * normal Zod issue instead (so a misconfigured `.env` produces the usual
 * "Invalid environment configuration - ..." message) - see that file's
 * own comment for why the check is duplicated in two idioms rather than
 * one throwing function called from both.
 */
export function assertAuthModeIsSafe(env: AuthModeEnv): AuthMode {
  const mode = computeAuthMode(env);
  if (mode === 'development' && env.NODE_ENV === 'production') {
    throw new Error(
      'AUTH_MODE=development is not allowed when NODE_ENV=production. Refusing to boot with the development ' +
        'authentication provider active in a production environment - see ' +
        'DEVELOPMENT_AUTHENTICATION_GUIDE.md. Set AUTH_MODE=cognito (or leave AUTH_MODE unset) instead.',
    );
  }
  return mode;
}
