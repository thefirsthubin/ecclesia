import { Injectable } from '@nestjs/common';
import type { RecordEngagementSignalInput } from '@ecclesia/contracts';
import type { EngagementSignal, Prisma } from '@prisma/client';

import { EngagementSignalRepository } from '../repositories/engagement-signal.repository';

/**
 * Insights' public service interface (Blueprint §7.2) for ingesting one
 * Engagement Signal. Deliberately has **no HTTP controller** in this
 * milestone: Blueprint §10.6 models every Engagement Signal as
 * asynchronous, arriving via the EventBridge/SQS bus described in
 * Blueprint Ch.4 and consumed by `apps/worker`, which does not exist yet
 * anywhere in this codebase (see `INSIGHTS_DESIGN_NOTES.md`'s disclosed
 * infra gap). This service is the landing point that future consumer
 * would call once it exists - injecting `EngagementSignalService` and
 * calling `record()` is then a one-line integration, not a redesign of
 * this module.
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
