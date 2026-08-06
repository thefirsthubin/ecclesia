import { Injectable } from '@nestjs/common';
import type { Pledge } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

/**
 * apps/worker's own Prisma-backed queries for the pledge-reminder-sweep.
 * Unlike `FlaggedTransactionSlaSweepRepository`, this one *does* mutate
 * (`markReminderSent`) - see `PledgeReminderSweepJob`'s own doc comment for
 * why that is safe here (`Pledge.reminderSentAt` is a plain nullable
 * column with no `actor_user_id` FK, unlike a `FinancialTransactionEvent`
 * row) and `WORKER_DESIGN_NOTES.md` for the "own repository, not a
 * cross-app import" rationale shared with every other worker-side
 * repository.
 */
@Injectable()
export class PledgeReminderSweepRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Every Pledge in a Branch eligible for its one, single reminder
   * (OQ-07: "a single, opt-in, gentle notice... never a repeated or
   * pressuring sequence") - `reminderOptIn: true`, `reminderSentAt: null`
   * (never yet sent - the persisted dedup marker that makes the
   * "never repeated" guarantee real, unlike `FlaggedTransactionSlaSweepJob`'s
   * "no dedup marker exists" case), `fulfilledTransactionId: null` (a
   * reminder to fulfill a pledge that is already fulfilled makes no
   * sense), and `pledgedAt` older than `olderThan` (the "gentle" half -
   * not nagged the moment the pledge is made). */
  listReminderCandidates(branchId: string, olderThan: Date): Promise<Pledge[]> {
    return this.prisma.pledge.findMany({
      where: {
        branchId,
        reminderOptIn: true,
        reminderSentAt: null,
        fulfilledTransactionId: null,
        pledgedAt: { lte: olderThan },
      },
    });
  }

  /** Marks a Pledge's one, single reminder as sent - the persisted fact
   * that prevents this sweep from re-signaling it on a future run. */
  markReminderSent(pledgeId: string, sentAt: Date): Promise<Pledge> {
    return this.prisma.pledge.update({
      where: { id: pledgeId },
      data: { reminderSentAt: sentAt },
    });
  }
}
