import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { EngagementSignalEnvelope } from '@ecclesia/contracts';

import type { EnvConfig } from '../config/env.schema';

/**
 * Publishes an `EngagementSignalEnvelope` (Blueprint §10.3) onto the one
 * shared EventBridge bus (§10.2, `EVENTBRIDGE_BUS_NAME`, defaulted to
 * `ecclesia-engagement-signals`). Two producers exist in this codebase:
 *
 * 1. `apps/worker`'s own scheduled sweeps (`SilentDriftSweepJob`,
 *    `FollowUpSlaSweepJob`, `AttendanceCompletenessSweepJob`,
 *    `FlaggedTransactionSlaSweepJob`, `PledgeReminderSweepJob`) call this
 *    class directly to publish the *synthetic* Engagement Signal a sweep
 *    emits on detecting a condition (§10.8: "On detecting a condition, a
 *    sweep job emits a synthetic Engagement Signal onto the same bus...
 *    rather than calling the Notification service directly, keeping
 *    exactly one downstream reaction mechanism regardless of trigger
 *    source").
 * 2. `apps/api`'s own domain-module services (Gatherings, People,
 *    Pastoral Care, Stewardship, Insights) publish real-time Engagement
 *    Signals via their own, separate `EventBridgePublisherService`
 *    (`apps/api/src/platform/events/eventbridge-publisher.service.ts`,
 *    not this class - see that file's own doc comment for why it's a
 *    deliberate near-duplicate rather than a shared import). **This
 *    corrects this comment's own prior text**, which said "no apps/api
 *    call site emits one yet" - that gap was closed in the Engagement
 *    Signal Ingestion Pipeline milestone; see
 *    `ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md` at the repo root.
 *
 * **`Source`/`DetailType` on the underlying `PutEventsCommand` are an
 * inferred implementation detail, not a Blueprint citation.** EventBridge's
 * `PutEvents` API requires a `Source` string and accepts an optional
 * `DetailType`; neither document specifies what either should contain.
 * `Source` is fixed to `'ecclesia.worker'` (every publish in this codebase
 * currently originates from apps/worker); `DetailType` is set to the
 * envelope's own `eventType` (e.g. `pastoral_care.silent_drift_flagged`),
 * the most literal available value and one a real EventBridge Rule could
 * filter on. Both are flagged here as constructions, not requirements.
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
          Source: 'ecclesia.worker',
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
