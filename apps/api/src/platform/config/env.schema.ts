import { z } from 'zod';

import { computeAuthMode } from '../auth/auth-mode';

/**
 * Process environment schema for apps/api (Sprint 1.2, Blueprint §6.2's
 * "typed configuration loading" applied to bootstrap/process config).
 *
 * This is deliberately separate from `libs/config`, which holds *Branch*
 * configuration (gathering types, Church Pulse weights, the Poimen-gate
 * flag) - business data that lives in the database and lands with the
 * Prisma milestone (Sprint 1.3). This schema is process configuration:
 * values that exist before any database connection does, read once at
 * boot from `process.env`.
 *
 * Zod, not class-validator, per the ADR already recorded in
 * `libs/contracts/src/lib/contracts.ts` (Blueprint §6.3: "Shared DTOs /
 * Zod schemas"). One validation library for the whole API, not two.
 */
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /**
   * Development Authentication sprint. Selects which `TokenVerifierService`
   * `auth.module.ts` wires up: real AWS Cognito (`'cognito'`) or the local
   * Development Identity Provider (`'development'`, `dev-auth.service.ts`
   * - STEPs 2-3 of the sprint brief). Optional here (no `.default()`) so
   * `computeAuthMode()`/`assertAuthModeIsSafe()` (`../auth/auth-mode.ts`)
   * can apply the brief's own default rule - "development locally, cognito
   * in production" - by falling back to `NODE_ENV` when this is unset,
   * rather than duplicating that inference as a second static default
   * here. The `.transform()` at the bottom of this schema replaces this
   * raw, possibly-unset value with the *computed* one before any consumer
   * ever reads `EnvConfig['AUTH_MODE']` - see that transform's own
   * comment.
   */
  AUTH_MODE: z.enum(['cognito', 'development']).optional(),

  /** HTTP port the API listens on. */
  PORT: z.coerce.number().int().positive().default(3000),

  /**
   * pino log level (Blueprint §14.1 code-quality; also feeds the denial
   * audit logging required by engineering-principles.md §5, Security by
   * Default). `silent` is intentionally excluded - a production deploy
   * that accidentally silences logging is a bug, not a valid setting.
   */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /**
   * Whether to mount the Swagger UI at `/docs`. Defaults on for local
   * development and CI; operators deploying to an environment reachable
   * outside the VPC should set this to `false` until Sprint 1.4
   * authentication can gate the docs route itself.
   */
  API_DOCS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  /**
   * PostgreSQL connection string consumed directly by `db/schema.prisma`'s
   * `datasource` block (`env("DATABASE_URL")`) - PrismaClient reads this
   * from `process.env` itself, not through `ConfigService`. Required, no
   * default: a process with no database to connect to should refuse to
   * boot, not start and fail on the first query (Sprint 1.3).
   */
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must be a postgresql:// or postgres:// connection string',
    ),

  /**
   * `[Row-Level Security sprint]` PostgreSQL connection string for
   * `PrismaService` - every ordinary business query, i.e. everything
   * except the handful of pre-Branch-known identity lookups
   * `PrismaRootService` exists for (`db/ROW_LEVEL_SECURITY_DESIGN_NOTES.md`
   * §2). Must point at `ecclesia_app`, the non-owner role
   * `db/migrations/20260801050000_row_level_security_enforcement`
   * creates - Blueprint §7.3's Row-Level Security policies do nothing at
   * runtime for a connection using the table-owning role (`DATABASE_URL`
   * itself, unchanged), since Postgres always lets an owner bypass RLS.
   * Required, no default, same "refuse to boot rather than silently fall
   * back to an unscoped connection" reasoning as `DATABASE_URL` itself.
   */
  APP_DATABASE_URL: z
    .string()
    .min(1, 'APP_DATABASE_URL is required')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'APP_DATABASE_URL must be a postgresql:// or postgres:// connection string',
    ),

  /**
   * Cognito User Pool ID (Sprint 1.4, Blueprint §8.1 ADR-004).
   * `[Design Decision, Development Authentication sprint]` Only
   * *conditionally* required now - the `.superRefine` below enforces
   * presence exclusively when the effective `AUTH_MODE` is `'cognito'`,
   * the same "fail fast" reasoning as before, just no longer unconditional:
   * a process booting in `AUTH_MODE=development` has no need to verify
   * Cognito tokens at all, so there is nothing to fail fast about. Format
   * is `<region>_<9 alphanumeric chars>` (e.g. `us-east-1_AbC123dEf`) -
   * Cognito's own ID format, validated loosely here since Cognito itself
   * is the source of truth for whether a given ID is real.
   */
  COGNITO_USER_POOL_ID: z.string().regex(/^[\w-]+_[0-9a-zA-Z]+$/, 'COGNITO_USER_POOL_ID must look like <region>_<poolId>').optional(),

  /** Cognito App Client ID (Sprint 1.4) - the `aud`/`client_id` claim access tokens must carry. Conditionally required, see `COGNITO_USER_POOL_ID`'s own comment. */
  COGNITO_CLIENT_ID: z.string().min(1).optional(),

  /**
   * AWS region the User Pool lives in (Sprint 1.4) - used to construct the
   * issuer URL (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>`,
   * Blueprint §8.1) that `aws-jwt-verify` uses to fetch the JWKS.
   * Conditionally required, see `COGNITO_USER_POOL_ID`'s own comment.
   */
  COGNITO_REGION: z.string().min(1).optional(),

  /**
   * `[Bug fix, Development Authentication sprint]` Comma-separated list of
   * origins `main.ts`'s `app.enableCors()` allows. Discovered live: with
   * no CORS configuration at all, a browser fetch from `apps/web-admin`'s
   * dev server (`http://localhost:4200`) to `apps/api` (`http://localhost:3000`)
   * is same-origin-policy-blocked before it ever reaches this codebase's
   * own logic - the browser refuses to let client JS read the response, so
   * `GET /auth/mode` fails from the frontend's point of view even though
   * the API itself handled it fine and logged nothing wrong. This is why
   * `AuthContext`'s restore effect (which treats a failed `/auth/mode`
   * fetch as "assume cognito, the safe default" - see that file's own
   * comment) silently fell back to the Cognito form instead of the
   * development picker: not an auth-mode bug, a transport-layer one that
   * had never been exercised before this sprint, since no earlier sprint
   * had a way to reach a real logged-in session at all (see
   * `DEVELOPMENT_AUTHENTICATION_GUIDE.md`).
   *
   * Optional, no forced default here - `main.ts` computes the effective
   * origin list: this value when set, else `http://localhost:4200` when
   * `NODE_ENV=development` (so local dev works with zero configuration,
   * matching `AUTH_MODE`'s own "development locally" default), else CORS
   * stays disabled (preserving today's production behavior - an operator
   * deploying `web-admin` from a different origin than `apps/api` must set
   * this explicitly, the same "fail fast on a real gap, don't guess a
   * production value nobody has specified" reasoning as `COGNITO_*`).
   */
  CORS_ORIGIN: z.string().optional(),
});

/**
 * Development Authentication sprint. Two effects layered onto the base
 * object schema:
 *
 * 1. `.superRefine` - the *conditional* half of `COGNITO_USER_POOL_ID`/
 *    `COGNITO_CLIENT_ID`/`COGNITO_REGION`'s "required" rule: present only
 *    when the effective `AUTH_MODE` (via `computeAuthMode`, the same
 *    function `auth.module.ts` uses) resolves to `'cognito'`. Also
 *    surfaces `assertAuthModeIsSafe`'s one hard rule (`AUTH_MODE=development`
 *    is never allowed when `NODE_ENV=production`) as a normal Zod issue
 *    here, so a misconfigured `.env` fails via this file's usual
 *    "Invalid environment configuration - ..." message rather than a
 *    differently-shaped thrown error. `auth.module.ts` re-runs the
 *    *throwing* form of that same check anyway (`assertAuthModeIsSafe`)
 *    as defense-in-depth at the one place a hard failure independent of
 *    this schema is appropriate - see that function's own comment for why
 *    the check exists in both idioms rather than one shared throwing
 *    function called from both.
 * 2. `.transform` - replaces the raw, possibly-unset `AUTH_MODE` with the
 *    *computed* value, so every downstream consumer (`ConfigService.get('AUTH_MODE')`)
 *    always reads a concrete `'cognito' | 'development'`, never has to
 *    re-derive it from `NODE_ENV` itself.
 */
const envSchema = baseEnvSchema
  .superRefine((data, ctx) => {
    const mode = computeAuthMode({ AUTH_MODE: data.AUTH_MODE, NODE_ENV: data.NODE_ENV });

    if (mode === 'development' && data.NODE_ENV === 'production') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['AUTH_MODE'],
        message: 'AUTH_MODE=development is not allowed when NODE_ENV=production - see DEVELOPMENT_AUTHENTICATION_GUIDE.md.',
      });
      return;
    }

    if (mode === 'cognito') {
      if (!data.COGNITO_USER_POOL_ID) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['COGNITO_USER_POOL_ID'], message: 'COGNITO_USER_POOL_ID is required when AUTH_MODE=cognito' });
      }
      if (!data.COGNITO_CLIENT_ID) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['COGNITO_CLIENT_ID'], message: 'COGNITO_CLIENT_ID is required when AUTH_MODE=cognito' });
      }
      if (!data.COGNITO_REGION) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['COGNITO_REGION'], message: 'COGNITO_REGION is required when AUTH_MODE=cognito' });
      }
    }
  })
  .transform((data) => ({
    ...data,
    AUTH_MODE: computeAuthMode({ AUTH_MODE: data.AUTH_MODE, NODE_ENV: data.NODE_ENV }),
  }));

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * `@nestjs/config`'s `ConfigModule.forRoot({ validate })` hook. Throwing
 * here means the process refuses to boot on an invalid or missing
 * required variable, rather than starting in a half-configured state and
 * failing confusingly later - the same "fail fast" reasoning
 * engineering-principles.md §5 applies to authorization applies to
 * configuration.
 */
export function validateEnv(rawConfig: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(rawConfig);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration - ${issues}`);
  }
  return result.data;
}
