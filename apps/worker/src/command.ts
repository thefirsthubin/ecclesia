/**
 * `WorkerCommand` parsing/dispatch, split out of `main.ts` deliberately -
 * see that file's own doc comment for the full rationale. The short
 * version: `main.ts` imports `WorkerModule`, whose `WorkerPlatformModule`
 * calls `ConfigModule.forRoot({ validate: validateEnv })` at
 * module-decoration time (NestJS evaluates a `@Module()` decorator's
 * `imports` array immediately when the file is loaded, not lazily on
 * first DI resolution) - so merely importing anything from `main.ts` for
 * its exports, the way `main.spec.ts` originally did, forced every test
 * run to have real environment variables present, which a plain `jest`
 * unit-test run has no reason to require. Confirmed as a real failure on
 * the user's own `pnpm test` run during the first vertical-slice
 * milestone (not merely a sandbox artifact) - see
 * `WORKER_DESIGN_NOTES.md`'s "Two real bugs..." section for the fix
 * history. `command.ts` imports only the five consumer/job classes
 * directly (none of which imports `WorkerPlatformModule` or calls
 * `ConfigModule.forRoot` anywhere in their own import chains - each
 * consumer/job class file imports only its own repository, the
 * EventBridge publisher, and a pino logger, never a `*.module.ts` file),
 * so `command.spec.ts` can exercise `parseCommand`/`runCommand` with zero
 * real environment configuration.
 */
import type { INestApplicationContext, Type } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { AuditConsumer } from './consumers/audit/audit.consumer';
import { InsightsConsumer } from './consumers/insights/insights.consumer';
import { NotificationConsumer } from './consumers/notification/notification.consumer';
import { AttendanceCompletenessSweepJob } from './jobs/attendance-completeness-sweep/attendance-completeness-sweep.job';
import { ChurchPulseRecomputeJob } from './jobs/church-pulse-recompute/church-pulse-recompute.job';
import { FlaggedTransactionSlaSweepJob } from './jobs/flagged-transaction-sla-sweep/flagged-transaction-sla-sweep.job';
import { FollowUpSlaSweepJob } from './jobs/follow-up-sla-sweep/follow-up-sla-sweep.job';
import { PledgeReminderSweepJob } from './jobs/pledge-reminder-sweep/pledge-reminder-sweep.job';
import { SilentDriftSweepJob } from './jobs/silent-drift-sweep/silent-drift-sweep.job';

export type WorkerCommand =
  | 'consume:insights'
  | 'consume:notification'
  | 'consume:audit'
  | 'sweep:silent-drift'
  | 'sweep:church-pulse-recompute'
  | 'sweep:follow-up-sla'
  | 'sweep:attendance-completeness'
  | 'sweep:flagged-transaction-sla'
  | 'sweep:pledge-reminder';

const VALID_COMMANDS: WorkerCommand[] = [
  'consume:insights',
  'consume:notification',
  'consume:audit',
  'sweep:silent-drift',
  'sweep:church-pulse-recompute',
  'sweep:follow-up-sla',
  'sweep:attendance-completeness',
  'sweep:flagged-transaction-sla',
  'sweep:pledge-reminder',
];

/**
 * Parses `process.argv`'s one positional command argument (e.g.
 * `node main.js consume:insights`) into a known `WorkerCommand`.
 */
export function parseCommand(argv: string[]): WorkerCommand {
  const [, , command] = argv;
  if (!command || !VALID_COMMANDS.includes(command as WorkerCommand)) {
    throw new Error(`Unknown or missing worker command '${command ?? ''}' - expected one of: ${VALID_COMMANDS.join(', ')}`);
  }
  return command as WorkerCommand;
}

/** Runs one long-poll consumer against `app.get(consumerType)` until
 * SIGTERM/SIGINT - the shared body every `consume:*` case needs. */
async function runConsumer<T extends { run(signal: AbortSignal): Promise<void> }>(
  app: INestApplicationContext,
  consumerType: Type<T>,
): Promise<void> {
  const consumer = app.get(consumerType);
  const controller = new AbortController();
  process.once('SIGTERM', () => controller.abort());
  process.once('SIGINT', () => controller.abort());
  await consumer.run(controller.signal);
}

/** Runs one scheduled sweep once against `app.get(jobType)` and logs the
 * count it returns - the shared body every `sweep:*` case needs. */
async function runSweep(
  app: INestApplicationContext,
  jobType: Type<{ run(): Promise<number> }>,
  describeResult: (count: number) => string,
): Promise<void> {
  const job = app.get(jobType);
  const count = await job.run();
  app.get(Logger).log(describeResult(count));
}

/**
 * Runs one `WorkerCommand` against an already-constructed Nest application
 * context.
 */
export async function runCommand(command: WorkerCommand, app: INestApplicationContext): Promise<void> {
  switch (command) {
    case 'consume:insights':
      return runConsumer(app, InsightsConsumer);
    case 'consume:notification':
      return runConsumer(app, NotificationConsumer);
    case 'consume:audit':
      return runConsumer(app, AuditConsumer);
    case 'sweep:silent-drift':
      return runSweep(app, SilentDriftSweepJob, (count) => `silent-drift-sweep flagged ${count} Person(s)`);
    case 'sweep:church-pulse-recompute':
      return runSweep(app, ChurchPulseRecomputeJob, (count) => `church-pulse-recompute recomputed ${count} scope(s)`);
    case 'sweep:follow-up-sla':
      return runSweep(app, FollowUpSlaSweepJob, (count) => `follow-up-sla-sweep signaled ${count} breach(es)`);
    case 'sweep:attendance-completeness':
      return runSweep(app, AttendanceCompletenessSweepJob, (count) => `attendance-completeness-sweep signaled ${count} incomplete Gathering(s)`);
    case 'sweep:flagged-transaction-sla':
      return runSweep(app, FlaggedTransactionSlaSweepJob, (count) => `flagged-transaction-sla-sweep signaled ${count} breach(es)`);
    case 'sweep:pledge-reminder':
      return runSweep(app, PledgeReminderSweepJob, (count) => `pledge-reminder-sweep signaled ${count} reminder(s)`);
  }
}
