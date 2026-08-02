import { z } from 'zod';

/**
 * Process environment schema for apps/worker (Worker milestone, mirroring
 * `apps/api/src/platform/config/env.schema.ts`'s own doc comment and
 * conventions exactly - see that file for why this is a Zod schema
 * separate from `libs/config`, and why it's an app-private file rather
 * than a shared `libs/env`: no such shared lib exists, and Nx's
 * app-to-app `enforce-module-boundaries` rule already active in this
 * workspace would forbid apps/worker importing from apps/api directly.
 *
 * The Worker milestone's first vertical slice ("Foundation + one full
 * vertical slice first" - see `apps/worker/WORKER_DESIGN_NOTES.md`)
 * declared only `SQS_INSIGHTS_QUEUE_URL`; this follow-up milestone (the
 * remaining two consumers + three sweep jobs) adds
 * `SQS_NOTIFICATION_QUEUE_URL`/`SQS_AUDIT_QUEUE_URL` for the same reason.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  /**
   * pino log level - identical purpose/citation to apps/api's own
   * `LOG_LEVEL` (Blueprint §14.1 code-quality).
   */
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  /**
   * PostgreSQL connection string. Identical purpose to apps/api's own
   * `DATABASE_URL` - both processes connect to the one shared Postgres
   * database (Blueprint ADR-003: schema-per-bounded-context in a single
   * database, not a database per service), each with its own PrismaClient
   * instance since no shared `libs/database` exists (see
   * `apps/worker/src/platform/database/prisma.service.ts`'s doc comment).
   * Required, no default - same "fail fast" reasoning as apps/api.
   */
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must be a postgresql:// or postgres:// connection string',
    ),

  /**
   * AWS region the EventBridge bus and SQS queues live in (Blueprint
   * §10.1/§10.2, ADR-007's EventBridge/SQS event architecture). Required,
   * no default: a Worker process that cannot reach the event bus should
   * refuse to boot, not start and fail on the first publish/poll - the
   * same reasoning `DATABASE_URL` and Cognito's `COGNITO_REGION` already
   * apply in apps/api.
   */
  AWS_REGION: z.string().min(1, 'AWS_REGION is required'),

  /**
   * The single EventBridge bus name (Blueprint §10.2 names it
   * `ecclesia-engagement-signals`) that `EventBridgePublisherService`
   * publishes every Engagement Signal onto, and that scheduled sweeps
   * (§10.8) publish their synthetic signals onto too. Defaulted to the
   * Blueprint's own named value rather than left required, since it is a
   * fixed architectural constant, not an environment-specific value that
   * legitimately differs between deployments.
   */
  EVENTBRIDGE_BUS_NAME: z.string().min(1).default('ecclesia-engagement-signals'),

  /**
   * The `insights-consumer` SQS queue's URL (Blueprint §10.2 names the
   * queue `insights-consumer`; the full queue URL, not just the name, is
   * what `@aws-sdk/client-sqs`'s `ReceiveMessageCommand`/
   * `DeleteMessageCommand` require). Required, no default - the same
   * "fail fast" reasoning as `DATABASE_URL`: a consumer process with no
   * queue to poll should refuse to boot. **[PRD-DERIVED]**: the Blueprint
   * names the queue, not the config variable that carries its URL - this
   * naming is a reasonable construction, not a citation.
   */
  SQS_INSIGHTS_QUEUE_URL: z.string().min(1, 'SQS_INSIGHTS_QUEUE_URL is required'),

  /**
   * The `notification-consumer` SQS queue's URL (Blueprint §10.2 names
   * the queue `notification-consumer`). Same "required, no default, fail
   * fast" reasoning as `SQS_INSIGHTS_QUEUE_URL`. **[PRD-DERIVED]** naming,
   * same caveat as that variable.
   */
  SQS_NOTIFICATION_QUEUE_URL: z.string().min(1, 'SQS_NOTIFICATION_QUEUE_URL is required'),

  /**
   * The `audit-consumer` SQS queue's URL (Blueprint §10.2 names the queue
   * `audit-consumer`). Same reasoning as the two queue URLs above.
   */
  SQS_AUDIT_QUEUE_URL: z.string().min(1, 'SQS_AUDIT_QUEUE_URL is required'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * `@nestjs/config`'s `ConfigModule.forRoot({ validate })` hook - identical
 * "fail fast on invalid/missing config" reasoning as apps/api's own
 * `validateEnv`.
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
