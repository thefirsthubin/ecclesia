import { Injectable } from '@nestjs/common';
import type { RecordEngagementSignalInput } from '@ecclesia/contracts';
import type { EngagementSignal, Prisma } from '@prisma/client';

import { EngagementSignalRepository } from '../repositories/engagement-signal.repository';

/**
 * Insights' public service interface (Blueprint §7.2) for ingesting one
 * Engagement Signal directly (synchronously, in-process). Deliberately has
 * **no HTTP controller**: Blueprint §10.6 models every Engagement Signal as
 * asynchronous, arriving via the EventBridge/SQS bus (Blueprint Ch.4).
 *
 * `[Engagement Signal Ingestion Pipeline milestone]` **Correction to this
 * comment's own prior text**: the bus and `apps/worker` no longer "do not
 * exist" - both were built in the Worker milestone
 * (`apps/worker/WORKER_DESIGN_NOTES.md`), and apps/api's own domain
 * modules now publish real Engagement Signals onto that bus at the point
 * each domain event happens (`ENGAGEMENT_SIGNAL_PIPELINE_DESIGN_NOTES.md`
 * at the repo root). This class remains the one piece of that end-to-end
 * path still unconnected: `apps/worker`'s `InsightsConsumer` writes
 * incoming signals via its own `WorkerEngagementSignalRepository` (a
 * deliberately separate Prisma repo, not this one - see that class's own
 * doc comment on Nx module-boundary rules), not through this service. This
 * service stays as apps/api's own in-process landing point for the day a
 * same-process caller (as opposed to a bus consumer) needs to record a
 * signal without a round trip through EventBridge - injecting
 * `EngagementSignalService` and calling `record()` is then a one-line
 * integration, not a redesign of this module.
 */
@Injectable()
export class EngagementSignalService {
  constructor(private readonly engagementSignalRepository: EngagementSignalRepository) {}

  record(input: RecordEngagementSignalInput): Promise<EngagementSignal> {
    return this.engagementSignalRepository.create({
      branchId: input.branchId,
      personId: input.personId,
      groupId: input.groupId,
      signalType: input.signalType,
      // `payload` is validated as a plain JSON-shaped object by
      // `recordEngagementSignalSchema` (`z.record(z.string(), z.unknown())`)
      // but Zod's `unknown` values don't structurally satisfy Prisma's
      // `InputJsonValue` - the same category of Prisma-vs-TS type gap
      // `gathering.service.ts`'s `Prisma.JsonNull` fix addressed for a
      // nullable Json column; this one is non-nullable, so a plain cast
      // is enough (no `JsonNull` case to handle).
      payload: input.payload as Prisma.InputJsonValue,
      occurredAt: new Date(input.occurredAt),
    });
  }
}
