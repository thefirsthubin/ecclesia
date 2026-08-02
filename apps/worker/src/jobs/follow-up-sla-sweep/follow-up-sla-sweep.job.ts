import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { isFollowUpTaskPastSla } from '@ecclesia/domain-pastoral-care';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { FollowUpSlaSweepRepository } from './follow-up-sla-sweep.repository';
import { EventBridgePublisherService } from '../../platform/events/eventbridge-publisher.service';

/**
 * The follow-up-sla-sweep (Blueprint §10.8: "...hourly for SLA checks").
 * Evaluates every `OPEN` Follow-up task with a `dueAt` set against
 * `isFollowUpTaskPastSla()` (`libs/domain/pastoral-care`, BR-PC-04) and
 * publishes a synthetic `pastoral_care.follow_up_task_sla_breached`
 * Engagement Signal for each one found past its SLA window - the same
 * §10.8 "sweep detects a condition, emits a synthetic signal onto the
 * same bus" pattern `SilentDriftSweepJob` already established.
 *
 * **Deliberately never mutates `FollowUpTask` itself - detects and
 * signals only, never auto-escalates.** BR-PC-04's escalation
 * ("escalates to the assigned Person's organizational superior") requires
 * resolving *who* that superior is - `FollowUpTaskService`'s own doc
 * comment (`apps/api/src/modules/pastoral-care`) already establishes that
 * no such resolution exists anywhere in this codebase (no rotation-state
 * field, no reporting-line pointer), and `FollowUpTaskService.escalate()`
 * requires an explicit, human-supplied `escalatedToPersonId`. If this
 * sweep instead flipped `status` to `ESCALATED` itself (with no target),
 * it would permanently block that same human escalation afterward -
 * `FollowUpTaskService.escalate()`'s `requireOpenOrEscalated` check throws
 * a `ConflictException` on an already-`ESCALATED` task, so a
 * system-initiated status change here would lock out the real,
 * human-initiated one. Publishing a signal (for a human/dashboard to act
 * on) rather than mutating state avoids that conflict entirely.
 *
 * **Re-publishes every run for as long as a task remains open and past
 * SLA - an intentional "keep reminding" behavior, not a missing dedup
 * check.** Unlike `SilentDriftSweepJob` (one `SilentDriftFlag` row makes
 * "already flagged" a real, persisted fact to check), there is no
 * schema entity here recording "this breach was already signaled" - and
 * unlike a silent-drift flag (a discrete new condition), an SLA breach is
 * genuinely ongoing every day it isn't resolved, so re-signaling each run
 * is the more defensible default in the absence of one. A future
 * iteration could reduce this signal volume with a `lastSlaBreachSignaledAt`
 * column, but that is a schema change outside this milestone's scope.
 */
@Injectable()
export class FollowUpSlaSweepJob {
  static readonly SIGNAL_TYPE = 'pastoral_care.follow_up_task_sla_breached';
  static readonly SCHEMA_VERSION = 1;

  constructor(
    private readonly repository: FollowUpSlaSweepRepository,
    private readonly publisher: EventBridgePublisherService,
    @InjectPinoLogger(FollowUpSlaSweepJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Returns the number of SLA breaches signaled. */
  async run(): Promise<number> {
    const branches = await this.repository.listBranches();
    let breachedCount = 0;
    for (const branch of branches) {
      breachedCount += await this.sweepBranch(branch.id);
    }
    return breachedCount;
  }

  private async sweepBranch(branchId: string): Promise<number> {
    const now = new Date();
    const tasks = await this.repository.listOpenTasksWithDueDate(branchId);

    let breachedCount = 0;
    for (const task of tasks) {
      const pastSla = isFollowUpTaskPastSla({ status: task.status, dueAt: task.dueAt, now });
      if (!pastSla) {
        continue;
      }

      await this.publisher.publish({
        eventId: randomUUID(),
        eventType: FollowUpSlaSweepJob.SIGNAL_TYPE,
        schemaVersion: FollowUpSlaSweepJob.SCHEMA_VERSION,
        branchId,
        occurredAt: now.toISOString(),
        subjectPersonId: task.personId,
        subjectGroupId: task.groupId ?? undefined,
        payload: {
          followUpTaskId: task.id,
          assignedToPersonId: task.assignedToPersonId,
          // `dueAt` is guaranteed non-null here - `listOpenTasksWithDueDate`
          // only ever returns rows where `dueAt IS NOT NULL`.
          dueAt: task.dueAt?.toISOString(),
        },
      });
      this.logger.info({ followUpTaskId: task.id, dueAt: task.dueAt }, 'Follow-up task SLA breach signaled');
      breachedCount += 1;
    }
    return breachedCount;
  }
}
