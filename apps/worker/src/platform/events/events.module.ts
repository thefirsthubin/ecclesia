import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EventBridgePublisherService } from './eventbridge-publisher.service';
import { ProcessedEventRepository } from './processed-event.repository';
import { SQS_CLIENT, sqsClientFactory } from './sqs-client.provider';
import { WorkerDatabaseModule } from '../database/database.module';
import type { EnvConfig } from '../config/env.schema';

/**
 * Event-bus infrastructure shared by every consumer/sweep this Worker
 * milestone builds (Blueprint §10 as a whole): the EventBridge publisher,
 * the shared SQS client, and the idempotency repository. Concrete
 * consumers (`InsightsConsumer`, ...) and jobs
 * (`SilentDriftSweepJob`, ...) each import this module rather than
 * reconstructing any of these three.
 *
 * `[Row-Level Security sprint]` `WorkerDatabaseModule` re-exported here
 * (whole-module re-export, the standard Nest pattern for making an
 * imported module's own exports transitively available - a provider
 * cannot be listed in this module's `exports` array unless it is also one
 * of this module's own `providers`, so re-exporting individual classes
 * like `PrismaService` directly would fail at bootstrap). Every
 * consumer/sweep module below imports only `EventsModule` (not
 * `WorkerDatabaseModule` directly) - `SqsConsumerBase` now needs
 * `PrismaService` injected, and three of the four sweep jobs now need
 * `BranchDirectoryRepository`, so both must be reachable through this
 * module. **This also fixes a latent DI-reachability gap predating this
 * sprint**: `SilentDriftSweepRepository`/`AttendanceCompletenessSweepRepository`/
 * `FollowUpSlaSweepRepository` already injected `PrismaService` despite
 * their own modules never importing anything that exported it - a runtime
 * failure this sandbox's `tsc`-only verification (TypeScript does not
 * check NestJS's module-graph DI resolution) could never have caught, and
 * neither could the user's own `pnpm build`/`pnpm lint` runs, only an
 * actual application boot or e2e test - neither of which exists yet for
 * apps/worker (`WORKER_DESIGN_NOTES.md`: `npx nx test worker` cannot run
 * in this sandbox at all).
 */
@Module({
  imports: [WorkerDatabaseModule],
  providers: [
    EventBridgePublisherService,
    ProcessedEventRepository,
    {
      provide: SQS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => sqsClientFactory(configService),
    },
  ],
  exports: [EventBridgePublisherService, ProcessedEventRepository, SQS_CLIENT, WorkerDatabaseModule],
})
export class EventsModule {}
