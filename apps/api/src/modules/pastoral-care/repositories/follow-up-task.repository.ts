import { Injectable } from '@nestjs/common';
import type { FollowUpTask, FollowUpTaskPriority, FollowUpTaskStatus, FollowUpTaskTrigger } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

/** §16.2's "sorted by SLA urgency" - open tasks with the soonest `dueAt`
 * first; tasks with no `dueAt` (should not occur in practice given
 * `FollowUpTaskService.create`'s always-computed default, but the column
 * is nullable) sort last rather than first. */
const DEFAULT_STATUSES: FollowUpTaskStatus[] = ['OPEN', 'ESCALATED'];

export interface CreateFollowUpTaskRecord {
  branchId: string;
  personId: string;
  assignedToPersonId: string;
  groupId?: string;
  dueAt?: Date;
  createdByPersonId?: string;
  /** `[Milestone B]` See `FollowUpTask.priority`/`.description`/`.trigger`'s
   * own doc comments in `db/schema.prisma`. */
  priority?: FollowUpTaskPriority;
  description?: string;
  trigger?: FollowUpTaskTrigger;
}

export interface UpdateFollowUpTaskStatusRecord {
  status: FollowUpTaskStatus;
  escalatedAt?: Date;
  escalatedToPersonId?: string;
  completedAt?: Date;
}

/** `[Milestone B]` `PATCH /follow-up-tasks/:id` - editing the brief
 * operational fields only, never `status` (that stays the dedicated
 * `updateStatus` method's job, matching the existing one-method-per-
 * transition pattern `complete()`/`escalate()` already established). */
export interface UpdateFollowUpTaskDetailsRecord {
  priority?: FollowUpTaskPriority;
  description?: string | null;
}

/**
 * Prisma-backed persistence for `pastoral_care.follow_up_tasks`
 * (FR-PC-03/04). Schema-scoped per Blueprint §6.4/§7.2, same rule as
 * `PoimenEnrollmentRepository`.
 */
@Injectable()
export class FollowUpTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateFollowUpTaskRecord): Promise<FollowUpTask> {
    return this.prisma.followUpTask.create({
      data: {
        branchId: input.branchId,
        personId: input.personId,
        assignedToPersonId: input.assignedToPersonId,
        groupId: input.groupId,
        dueAt: input.dueAt,
        createdByPersonId: input.createdByPersonId,
        priority: input.priority,
        description: input.description,
        trigger: input.trigger,
      },
    });
  }

  findById(id: string): Promise<FollowUpTask | null> {
    return this.prisma.followUpTask.findUnique({ where: { id } });
  }

  /** `GET /pastoral-care/groups/:groupId/follow-up-tasks` (Shepherd
   * Dashboard sprint - see this file's own repository doc comment; no
   * caller before this sprint needed a list, only single-task CRUD). */
  listByGroup(groupId: string, statuses: FollowUpTaskStatus[] = DEFAULT_STATUSES): Promise<FollowUpTask[]> {
    return this.prisma.followUpTask.findMany({
      where: { groupId, status: { in: statuses } },
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    });
  }

  /** `GET /pastoral-care/follow-up-tasks` with no `groupId` (Pastoral Care
   * Web Admin sprint) - the BRANCH-wide counterpart to `listByGroup`, for
   * a BRANCH-scoped actor (Resident Pastor, Admin) who has no single
   * Group to name. Same default-statuses/ordering as `listByGroup`. */
  listByBranch(branchId: string, statuses: FollowUpTaskStatus[] = DEFAULT_STATUSES): Promise<FollowUpTask[]> {
    return this.prisma.followUpTask.findMany({
      where: { branchId, status: { in: statuses } },
      orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
    });
  }

  /** `[Milestone B, Slice 7 - Pastoral Calendar]` Open/escalated tasks
   * whose `dueAt` falls in a date window, for the composed calendar
   * read-model (`PastoralCalendarService`) - see
   * MILESTONE_B_DESIGN_NOTES.md Part 10. Reuses `DEFAULT_STATUSES`
   * (`OPEN, ESCALATED`) - a `COMPLETED`/`CANCELLED` task has nothing left
   * to show on a forward-looking calendar. */
  listByBranchWithDueAtInRange(branchId: string, from: Date, to: Date): Promise<FollowUpTask[]> {
    return this.prisma.followUpTask.findMany({
      where: { branchId, status: { in: DEFAULT_STATUSES }, dueAt: { gte: from, lte: to } },
      orderBy: { dueAt: 'asc' },
    });
  }

  /** `GET /people/:personId/follow-up-tasks` (Branch Pastor Portal,
   * Pastoral Care sprint) - the "People -> Member -> Pastoral Care"
   * direction PRD §16.2's Person profile has never had a route for.
   * Every status, not just `DEFAULT_STATUSES` - a Person's own history
   * view is meant to show completed/escalated tasks too, not only the
   * still-open ones a queue view defaults to. Newest first (`createdAt`
   * desc) - a history view reads top-to-bottom as "most recent first",
   * unlike the queue's own SLA-urgency ordering. */
  listByPerson(personId: string): Promise<FollowUpTask[]> {
    return this.prisma.followUpTask.findMany({
      where: { personId },
      orderBy: { createdAt: 'desc' },
    });
  }

  updateStatus(id: string, input: UpdateFollowUpTaskStatusRecord): Promise<FollowUpTask> {
    return this.prisma.followUpTask.update({ where: { id }, data: input });
  }

  /** `[Milestone B]` `PATCH /follow-up-tasks/:id` - see
   * `UpdateFollowUpTaskDetailsRecord`'s own doc comment for why this is a
   * separate method from `updateStatus` above. */
  updateDetails(id: string, input: UpdateFollowUpTaskDetailsRecord): Promise<FollowUpTask> {
    return this.prisma.followUpTask.update({ where: { id }, data: input });
  }
}
