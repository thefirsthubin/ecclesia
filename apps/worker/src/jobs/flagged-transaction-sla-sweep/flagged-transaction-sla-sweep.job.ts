import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { FlaggedTransactionSlaSweepRepository } from './flagged-transaction-sla-sweep.repository';
import { BranchDirectoryRepository } from '../../platform/database/branch-directory.repository';
import { PrismaService } from '../../platform/database/prisma.service';
import { EventBridgePublisherService } from '../../platform/events/eventbridge-publisher.service';

/** How long a Financial Transaction may remain `FLAGGED` before this sweep
 * signals a breach. **[INFERRED]**, not a citation - PRD §12.7 names the
 * `Flagged -> UnderInvestigation` edge as "discrepancy unresolved past
 * SLA" but specifies no concrete duration anywhere
 * (`FinancialTransactionService.escalate()`'s own doc comment already
 * discloses this), and `STEWARDSHIP_DESIGN_NOTES.md`'s "what this
 * milestone deliberately does not build" section names the same gap. 72
 * hours (3 business days) is chosen as a reasonable "a Treasurer has had a
 * few days to resolve this" default, shorter than the weekly
 * reconciliation cadence (FR-STW-07) so a stale discrepancy doesn't first
 * surface a full week later. */
export const DEFAULT_FLAGGED_SLA_HOURS = 72;

/**
 * The flagged-transaction-sla-sweep (Blueprint §10.8; PRD §12.7's
 * `Flagged -> UnderInvestigation`: "discrepancy unresolved past SLA").
 * `[Stewardship gaps sprint]` Closes the "no scheduler evaluates the SLA
 * automatically" gap `FinancialTransactionService.escalate()`'s own doc
 * comment and `STEWARDSHIP_DESIGN_NOTES.md` both disclose, the same
 * "detect and signal" pattern already established by
 * `FollowUpSlaSweepJob`/`AttendanceCompletenessSweepJob`.
 *
 * **Deliberately never mutates `FinancialTransaction` itself - detects and
 * signals only, never auto-escalates.** Unlike a `SilentDriftFlag` row
 * (its own new schema entity, no actor required) or `Pledge.reminderSentAt`
 * (a plain nullable column on an already-mutable row), appending a new
 * `FinancialTransactionEvent` requires a real `actorUserId`
 * (`db/schema.prisma`: `actor_user_id UUID NOT NULL REFERENCES
 * platform.users(id)`, `onDelete: Restrict`) - there is no "system actor"
 * `platform.users` row anywhere in this codebase for an automated sweep to
 * attribute the transition to (the same gap `ROW_LEVEL_SECURITY_DESIGN_
 * NOTES.md` flags as a future need, not one this sprint invents a fix
 * for). Auto-mutating here would mean either fabricating a fake actor (a
 * bigger, disclosed-elsewhere architectural decision) or leaving
 * `actorUserId` null (a schema constraint violation) - so, exactly like
 * `FollowUpSlaSweepJob`'s own equivalent "escalation needs a
 * human-supplied `escalatedToPersonId`" blocker, this sweep publishes a
 * synthetic `stewardship.flagged_transaction_sla_breached` Engagement
 * Signal for a human (Treasurer/Admin) to act on via
 * `FinancialTransactionService.escalate()`'s existing manual endpoint,
 * rather than mutating state itself.
 *
 * **Re-publishes every run for as long as a transaction remains `FLAGGED`
 * and past the SLA window** - the same disclosed "no schema field to
 * record 'already signaled'" reasoning `FollowUpSlaSweepJob`'s own doc
 * comment gives.
 */
@Injectable()
export class FlaggedTransactionSlaSweepJob {
  static readonly SIGNAL_TYPE = 'stewardship.flagged_transaction_sla_breached';
  static readonly SCHEMA_VERSION = 1;

  constructor(
    private readonly repository: FlaggedTransactionSlaSweepRepository,
    private readonly branchDirectory: BranchDirectoryRepository,
    private readonly prisma: PrismaService,
    private readonly publisher: EventBridgePublisherService,
    @InjectPinoLogger(FlaggedTransactionSlaSweepJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Returns the number of SLA breaches signaled. */
  async run(): Promise<number> {
    const branches = await this.branchDirectory.listBranches();
    let breachedCount = 0;
    for (const branch of branches) {
      breachedCount += await this.prisma.runInBranchScope(branch.id, () => this.sweepBranch(branch.id));
    }
    return breachedCount;
  }

  private async sweepBranch(branchId: string): Promise<number> {
    const now = new Date();
    const slaThreshold = new Date(now.getTime() - DEFAULT_FLAGGED_SLA_HOURS * 60 * 60 * 1000);
    const candidates = await this.repository.listFlaggedWithFlaggedAt(branchId);

    let breachedCount = 0;
    for (const candidate of candidates) {
      if (candidate.flaggedAt > slaThreshold) {
        continue;
      }

      await this.publisher.publish({
        eventId: randomUUID(),
        eventType: FlaggedTransactionSlaSweepJob.SIGNAL_TYPE,
        schemaVersion: FlaggedTransactionSlaSweepJob.SCHEMA_VERSION,
        branchId,
        occurredAt: now.toISOString(),
        subjectPersonId: candidate.giverPersonId ?? undefined,
        subjectGroupId: candidate.sourceGroupId ?? undefined,
        payload: {
          financialTransactionId: candidate.id,
          flaggedAt: candidate.flaggedAt.toISOString(),
          slaHours: DEFAULT_FLAGGED_SLA_HOURS,
        },
      });
      this.logger.info({ financialTransactionId: candidate.id, flaggedAt: candidate.flaggedAt }, 'Flagged transaction SLA breach signaled');
      breachedCount += 1;
    }
    return breachedCount;
  }
}
