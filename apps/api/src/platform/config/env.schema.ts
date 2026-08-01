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
