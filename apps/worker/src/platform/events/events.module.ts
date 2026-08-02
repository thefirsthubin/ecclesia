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
  exports: [EventBridgePublisherService, ProcessedEventRepository, SQS_CLIENT],
})
export class EventsModule {}
