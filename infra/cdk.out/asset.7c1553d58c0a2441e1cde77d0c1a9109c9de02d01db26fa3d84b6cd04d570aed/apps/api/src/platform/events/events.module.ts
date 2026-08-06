import { Module } from '@nestjs/common';

import { EventBridgePublisherService } from './eventbridge-publisher.service';

/**
 * `[Engagement Signal Ingestion Pipeline milestone]` apps/api's own event-bus
 * infrastructure module - currently just the one publisher, mirroring
 * `apps/worker/src/platform/events/events.module.ts`'s own doc comment (that
 * module additionally bundles a shared SQS client and the idempotency
 * repository, neither of which apps/api needs: it only ever publishes,
 * never consumes, so there is no SQS polling loop or `processed_events`
 * write path here). Every bounded-context module that needs to publish an
 * Engagement Signal (Gatherings, People, Pastoral Care, Stewardship,
 * Insights) imports this module directly, the same "no central god-module"
 * precedent `DatabaseModule`/`RbacPlatformModule` already set (see
 * `GatheringsModule`'s own doc comment) rather than adding this to
 * `PlatformModule` and having every module inherit it transitively.
 */
@Module({
  providers: [EventBridgePublisherService],
  exports: [EventBridgePublisherService],
})
export class EventsModule {}
