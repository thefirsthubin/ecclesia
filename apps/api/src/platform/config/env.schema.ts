import { z } from 'zod';

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
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

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
   * Cognito User Pool ID (Sprint 1.4, Blueprint §8.1 ADR-004). Required,
   * no default, same "fail fast" reasoning as `DATABASE_URL`: a process
   * that cannot verify access tokens should refuse to boot, not start and
   * fail confusingly on the first authenticated request. Format is
   * `<region>_<9 alphanumeric chars>` (e.g. `us-east-1_AbC123dEf`) - Cognito's
   * own ID format, validated loosely here since Cognito itself is the
   * source of truth for whether a given ID is real.
   */
  COGNITO_USER_POOL_ID: z
    .string()
    .min(1, 'COGNITO_USER_POOL_ID is required')
    .regex(/^[\w-]+_[0-9a-zA-Z]+$/, 'COGNITO_USER_POOL_ID must look like <region>_<poolId>'),

  /** Cognito App Client ID (Sprint 1.4) - the `aud`/`client_id` claim access tokens must carry. */
  COGNITO_CLIENT_ID: z.string().min(1, 'COGNITO_CLIENT_ID is required'),

  /**
   * AWS region the User Pool lives in (Sprint 1.4) - used to construct the
   * issuer URL (`https://cognito-idp.<region>.amazonaws.com/<userPoolId>`,
   * Blueprint §8.1) that `aws-jwt-verify` uses to fetch the JWKS.
   */
  COGNITO_REGION: z.string().min(1, 'COGNITO_REGION is required'),
});

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
