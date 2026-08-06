import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import type { EnvConfig } from '../config/env.schema';

/**
 * `[Engagement Signal Ingestion Pipeline milestone]` apps/api's own
 * `EventBridgePublisherService` - the "live event producer in apps/api"
 * `apps/worker/src/platform/events/eventbridge-publisher.service.ts`'s own
 * doc comment named as not yet built ("no apps/api call site emits one
 * yet"). This class is a deliberate near-duplicate of that one, not a
 * shared import - apps/api and apps/worker are sibling Nx applications,
 * and this workspace's `enforce-module-boundaries` app-to-app rule (no
 * `scope:app-backend` project may depend on another `scope:app-backend`
 * project) already forbids either one importing the other directly. This
 * mirrors the exact precedent `apps/worker/src/consumers/insights/engagement-signal.repository.ts`
 * set for the equivalent situation on the read/write side (see that file's
 * own doc comment: "deliberately a separate Prisma repo from apps/api's,
 * not a shared import, per Nx module-boundary rules"). Two small,
 * independently testable copies of a ~30-line AWS SDK wrapper is a smaller
 * footprint than inventing a new shared `libs/platform-events` leaf library
 * for one class, which `apps/worker`'s own `WORKER_DESIGN_NOTES.md` never
 * called for either.
 *
 * `Source` is `'ecclesia.api'` here (vs. apps/worker's `'ecclesia.worker'`)
 * - the one intentional divergence from the mirrored file, since these are
 * now two distinct real publishers and a downstream EventBridge Rule or
 * consumer that ever needs to tell them apart (e.g. for operational
 * debugging) should be able to via the `Source` field, exactly as
 * EventBridge's `PutEvents` API is designed to be used. `DetailType` is
 * still the envelope's own `eventType`, unchanged from the worker version.
 */
@Injectable()
export class EventBridgePublisherService {
  private readonly client: EventBridgeClient;
  private readonly busName: string;

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    @InjectPinoLogger(EventBridgePublisherService.name) private readonly logger: PinoLogger,
  ) {
    this.client = new EventBridgeClient({ region: this.configService.get('AWS_REGION', { infer: true }) });
    this.busName = this.configService.get('EVENTBRIDGE_BUS_NAME', { infer: true });
  }

  async publish(envelope: EngagementSignalEnvelope): Promise<void> {
    const command = new PutEventsCommand({
      Entries: [
        {
          EventBusName: this.busName,
          Source: 'ecclesia.api',
          DetailType: envelope.eventType,
          Detail: JSON.stringify(envelope),
        },
      ],
    });

    const result = await this.client.send(command);
    if (result.FailedEntryCount && result.FailedEntryCount > 0) {
      const failure = result.Entries?.find((entry: { ErrorCode?: string }) => entry.ErrorCode);
      throw new Error(
        `EventBridge PutEvents failed for eventId=${envelope.eventId}: ${failure?.ErrorCode} ${failure?.ErrorMessage}`,
      );
    }

    this.logger.info({ eventId: envelope.eventId, eventType: envelope.eventType }, 'Published Engagement Signal to EventBridge');
  }
}
