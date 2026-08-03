import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { PledgeReminderSweepRepository } from './pledge-reminder-sweep.repository';
import { BranchDirectoryRepository } from '../../platform/database/branch-directory.repository';
import { PrismaService } from '../../platform/database/prisma.service';
import { EventBridgePublisherService } from '../../platform/events/eventbridge-publisher.service';

/** How long after `pledgedAt` an opted-in, unfulfilled Pledge becomes
 * eligible for its one reminder. **[INFERRED]**, not a citation - OQ-07's
 * resolution ("a single, opt-in, gentle notice... never a repeated or
 * pressuring sequence") names the *tone* but no concrete delay, and
 * `STEWARDSHIP_DESIGN_NOTES.md`'s "what this milestone deliberately does
 * not build" section names the same gap ("no scheduler exists to actually
 * send it"). 14 days is chosen as a reasonable "give it two weeks before a
 * single gentle nudge" default. */
export const DEFAULT_PLEDGE_REMINDER_DELAY_DAYS = 14;

/**
 * The pledge-reminder-sweep (Blueprint §10.8; FR-STW-08/H2, OQ-07). Closes
 * the "no scheduler sends the opted-in reminder" gap
 * `STEWARDSHIP_DESIGN_NOTES.md` names, the same "detect and signal"
 * pattern already established by `FollowUpSlaSweepJob`/
 * `AttendanceCompletenessSweepJob`.
 *
 * **Does mutate `Pledge` - unlike `FlaggedTransactionSlaSweepJob`, this is
 * safe here.** `Pledge.reminderSentAt` is a plain nullable
 * `DateTime?` column with no `actor_user_id` FK (`db/schema.prisma`), not
 * an append-only audited event log entry - marking it requires no
 * fabricated "who did this" actor, only a timestamp. Marking it is also
 * what makes OQ-07's "never a repeated... sequence" guarantee real: unlike
 * `FollowUpSlaSweepJob`/`FlaggedTransactionSlaSweepJob` (which re-signal
 * every run for lack of a persisted "already signaled" marker),
 * `reminderSentAt` *is* that marker, so `listReminderCandidates` naturally
 * excludes an already-reminded Pledge from every future run - a true
 * single send, not a "re-published every run" one.
 */
@Injectable()
export class PledgeReminderSweepJob {
  static readonly SIGNAL_TYPE = 'stewardship.pledge_reminder_due';
  static readonly SCHEMA_VERSION = 1;

  constructor(
    private readonly repository: PledgeReminderSweepRepository,
    private readonly branchDirectory: BranchDirectoryRepository,
    private readonly prisma: PrismaService,
    private readonly publisher: EventBridgePublisherService,
    @InjectPinoLogger(PledgeReminderSweepJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Returns the number of pledge reminders signaled and marked sent. */
  async run(): Promise<number> {
    const branches = await this.branchDirectory.listBranches();
    let remindedCount = 0;
    for (const branch of branches) {
      remindedCount += await this.prisma.runInBranchScope(branch.id, () => this.sweepBranch(branch.id));
    }
    return remindedCount;
  }

  private async sweepBranch(branchId: string): Promise<number> {
    const now = new Date();
    const olderThan = new Date(now.getTime() - DEFAULT_PLEDGE_REMINDER_DELAY_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await this.repository.listReminderCandidates(branchId, olderThan);

    let remindedCount = 0;
    for (const pledge of candidates) {
      await this.publisher.publish({
        eventId: randomUUID(),
        eventType: PledgeReminderSweepJob.SIGNAL_TYPE,
        schemaVersion: PledgeReminderSweepJob.SCHEMA_VERSION,
        branchId,
        occurredAt: now.toISOString(),
        subjectPersonId: pledge.personId,
        payload: {
          pledgeId: pledge.id,
          projectId: pledge.projectId,
          pledgedAmountMinor: pledge.pledgedAmountMinor.toString(),
          pledgedAt: pledge.pledgedAt.toISOString(),
        },
      });
      await this.repository.markReminderSent(pledge.id, now);
      this.logger.info({ pledgeId: pledge.id }, 'Pledge reminder signaled and marked sent');
      remindedCount += 1;
    }
    return remindedCount;
  }
}
