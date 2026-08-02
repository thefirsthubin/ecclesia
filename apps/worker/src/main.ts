/**
 * Entry point for the Ecclesia Worker service (Blueprint Ch.1 §3, Ch.4,
 * ADR-007: a long-running ECS Fargate container, not a Lambda-per-message
 * design - both apps/api and apps/worker run this way, per ADR-007's
 * explicit rejection of Lambda for cold-start-latency reasons).
 *
 * This milestone ("Foundation + one full vertical slice first" - see
 * `WORKER_DESIGN_NOTES.md`) replaces the Sprint 0 scaffold's no-op
 * `bootstrap()` with a real command dispatcher: `main.ts` reads one
 * positional CLI argument naming which job/consumer this particular ECS
 * task invocation runs (Blueprint's own container-per-command deployment
 * shape - the same worker image, different `command` override at the
 * task-definition level, not a separate image per job/consumer).
 *
 * `parseCommand`/`runCommand` themselves live in `./command.ts`, not
 * here - deliberately, so they can be unit-tested (`main.spec.ts`)
 * without transitively importing `WorkerModule`. `WorkerPlatformModule`
 * calls `ConfigModule.forRoot({ validate: validateEnv })` at
 * module-decoration time (immediately on import, not lazily), so any
 * file that imports `WorkerModule` - even just to re-export something
 * else from the same file - forces real `AWS_REGION`/
 * `SQS_INSIGHTS_QUEUE_URL`/`DATABASE_URL` environment variables to be
 * present just to load that file. A prior version of this file had
 * `parseCommand`/`runCommand` defined here directly, which broke
 * `pnpm test` for exactly this reason (confirmed on the user's own real
 * `pnpm test` run, not just this sandbox) - see `command.ts`'s own doc
 * comment for the full explanation.
 *
 * Two commands exist after this milestone's vertical slice:
 * - `consume:insights` - runs `InsightsConsumer.run()` in an unbounded
 *   long-poll loop until SIGTERM/SIGINT, the ECS Fargate long-running-
 *   process shape.
 * - `sweep:silent-drift` - runs `SilentDriftSweepJob.run()` once and
 *   exits, the EventBridge-Scheduler-triggered-task shape (§10.8).
 *
 * `NestFactory.createApplicationContext()`, not `NestFactory.create()`, is
 * used - apps/worker has no HTTP surface to listen on, only Nest's
 * dependency-injection container (own inferred choice, not mandated by
 * either document; the Blueprint doesn't specify a Node/Nest bootstrap
 * style for the worker - see `WORKER_DESIGN_NOTES.md`).
 */
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { WorkerModule } from './app/worker.module';
import { parseCommand, runCommand } from './command';

export async function bootstrap(): Promise<void> {
  const command = parseCommand(process.argv);
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  try {
    await runCommand(command, app);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  bootstrap().catch((error: unknown) => {
    // The pino logger may not exist yet if bootstrap failed before
    // `createApplicationContext` resolved - console.error is the only
    // guaranteed-available fallback, same reasoning as apps/api's main.ts.
    // No eslint-disable needed: the workspace no-console rule explicitly
    // allows console.error (eslint.config.cjs).
    console.error('[worker] Fatal error during bootstrap', error);
    process.exitCode = 1;
  });
}
