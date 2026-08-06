import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../database/prisma.service';

/**
 * Prisma-backed idempotency check for `platform.processed_events`
 * (Blueprint §10.5, `db/schema.prisma`'s `ProcessedEvent` model - see its
 * own doc comment there for the "one shared table, `consumerName`
 * discriminator" design decision).
 *
 * `tryRecord` is the one method every consumer/sweep calls, and it is
 * deliberately **atomic**: rather than a separate `isProcessed()` check
 * followed by a separate `markProcessed()` write (which would leave a
 * race window between two concurrently-polling ECS Fargate tasks - both
 * could pass the check before either writes), this attempts the INSERT
 * first and lets the table's own `@@unique([consumerName, eventId])`
 * constraint (`processed_events_consumer_name_event_id_key`) be the single
 * source of truth for "have I seen this eventId before." A unique-
 * violation on that insert *is* the "already processed" answer, not an
 * error condition to propagate.
 */
@Injectable()
export class ProcessedEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Attempts to record `eventId` as processed by `consumerName`. Returns
   * `true` if this call is the one that newly recorded it (the caller
   * should proceed to process the message/event), or `false` if it was
   * already recorded (the caller should no-op - Blueprint §10.5: "at-least-
   * once delivery... processing is a no-op on replay").
   */
  async tryRecord(consumerName: string, eventId: string, branchId: string): Promise<boolean> {
    try {
      await this.prisma.processedEvent.create({
        data: { consumerName, eventId, branchId },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }
}
