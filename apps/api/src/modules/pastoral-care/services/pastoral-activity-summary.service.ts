import { Injectable } from '@nestjs/common';
import type {
  PastoralActivityCounsellingSummaryDto,
  PastoralActivityFollowUpSummaryDto,
  PastoralActivityInteractionSummaryDto,
  PastoralActivitySummaryResponseDto,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { CounsellingSession, FollowUpTask, FollowUpTaskStatus, MemberInteraction } from '@prisma/client';

import { GroupMembershipService } from '../../people/services/group-membership.service';
import { CounsellingSessionRepository } from '../repositories/counselling-session.repository';
import { FollowUpTaskRepository } from '../repositories/follow-up-task.repository';
import { MemberInteractionRepository } from '../repositories/member-interaction.repository';

type ActivitySections = [FollowUpTask[], CounsellingSession[], MemberInteraction[]];

const ALL_FOLLOW_UP_TASK_STATUSES: FollowUpTaskStatus[] = ['OPEN', 'IN_PROGRESS', 'ESCALATED', 'COMPLETED', 'CANCELLED'];
const OVERDUE_ELIGIBLE_STATUSES: FollowUpTaskStatus[] = ['OPEN', 'ESCALATED'];
const UNSPECIFIED_TRIGGER = 'UNSPECIFIED';

/**
 * `[Milestone C.1.3: Pastoral Activity Analytics]` `GET
 * /pastoral-care/activity-summary` - safe aggregate reporting over the
 * same three facts `PastoralCalendarService` already composes
 * (`FollowUpTask`, `CounsellingSession`, `MemberInteraction`), reusing
 * its identical cluster-narrowing shape (`actor.clusterBacentaIds` ->
 * `GroupMembershipService.listActivePersonIdsForGroups` ->
 * `personId`-filtered repository calls) rather than inventing a second
 * one. No new repository methods - see
 * `getPastoralActivitySummaryQuerySchema`'s own doc comment for why
 * `FollowUpTask` counts are a current-state snapshot (`listByBranch`/
 * `listByGroups` with every status) while `CounsellingSession`/
 * `MemberInteraction` counts are windowed by `from`/`to`.
 *
 * **Never exposes `FollowUpTask.description`, `CounsellingSession.briefNote`,
 * or `MemberInteraction.briefNote`.** The repository calls this reuses
 * return full rows (no new `select`-scoped query was added, to avoid a
 * third repository shape for the same tables), so the privacy boundary
 * is enforced here, at the DTO-mapping layer: the private `summarize*`
 * methods below only ever read `status`/`trigger`/`assignedToPersonId`/
 * `dueAt`/`type` off each row, never the content fields - the same
 * discipline `PrayerNote.content` has never once been readable through
 * any endpoint other than `PrayerNoteController`'s own routes.
 */
@Injectable()
export class PastoralActivitySummaryService {
  constructor(
    private readonly followUpTaskRepository: FollowUpTaskRepository,
    private readonly counsellingSessionRepository: CounsellingSessionRepository,
    private readonly memberInteractionRepository: MemberInteractionRepository,
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  async getSummary(actor: ActorContext, from: Date, to: Date): Promise<PastoralActivitySummaryResponseDto> {
    const clusterGroupIds = actor.clusterBacentaIds;
    const [followUpTasks, counsellingSessions, interactions] =
      clusterGroupIds && clusterGroupIds.length > 0
        ? await this.getClusterScopedSections(clusterGroupIds, from, to)
        : await Promise.all([
            this.followUpTaskRepository.listByBranch(actor.branchId, ALL_FOLLOW_UP_TASK_STATUSES),
            this.counsellingSessionRepository.listScheduledInRange(actor.branchId, from, to),
            this.memberInteractionRepository.listScheduledInRange(actor.branchId, from, to),
          ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      followUpTasks: this.summarizeFollowUpTasks(followUpTasks),
      counsellingSessions: this.summarizeCounsellingSessions(counsellingSessions),
      interactions: this.summarizeInteractions(interactions),
    };
  }

  /** `[Milestone C.1.3]` See `PastoralCalendarService.getClusterScopedSections`'s
   * own doc comment - identical shape, reused rather than duplicated. */
  private async getClusterScopedSections(clusterGroupIds: string[], from: Date, to: Date): Promise<ActivitySections> {
    const personIds = await this.groupMembershipService.listActivePersonIdsForGroups(clusterGroupIds);
    return Promise.all([
      this.followUpTaskRepository.listByGroups(clusterGroupIds, ALL_FOLLOW_UP_TASK_STATUSES),
      this.counsellingSessionRepository.listScheduledInRangeForPersons(personIds, from, to),
      this.memberInteractionRepository.listScheduledInRangeForPersons(personIds, from, to),
    ]);
  }

  private summarizeFollowUpTasks(tasks: FollowUpTask[]): PastoralActivityFollowUpSummaryDto {
    const now = new Date();
    const byStatus = { OPEN: 0, IN_PROGRESS: 0, ESCALATED: 0, COMPLETED: 0, CANCELLED: 0 };
    const byAssignee = new Map<string, number>();
    const byTrigger = new Map<string, number>();
    let overdueCount = 0;

    for (const task of tasks) {
      byStatus[task.status] += 1;
      if (task.dueAt && task.dueAt < now && OVERDUE_ELIGIBLE_STATUSES.includes(task.status)) {
        overdueCount += 1;
      }
      byAssignee.set(task.assignedToPersonId, (byAssignee.get(task.assignedToPersonId) ?? 0) + 1);
      const triggerKey = task.trigger ?? UNSPECIFIED_TRIGGER;
      byTrigger.set(triggerKey, (byTrigger.get(triggerKey) ?? 0) + 1);
    }

    const totalCount = tasks.length;
    const completionRate = totalCount === 0 ? null : Math.round((byStatus.COMPLETED / totalCount) * 1000) / 10;

    return {
      totalCount,
      byStatus,
      overdueCount,
      completionRate,
      byAssignee: Array.from(byAssignee.entries()).map(([assignedToPersonId, count]) => ({ assignedToPersonId, count })),
      byTrigger: Object.fromEntries(byTrigger),
    };
  }

  private summarizeCounsellingSessions(sessions: CounsellingSession[]): PastoralActivityCounsellingSummaryDto {
    const byStatus = new Map<string, number>();
    for (const session of sessions) {
      byStatus.set(session.status, (byStatus.get(session.status) ?? 0) + 1);
    }
    return { totalCount: sessions.length, byStatus: Object.fromEntries(byStatus) };
  }

  private summarizeInteractions(interactions: MemberInteraction[]): PastoralActivityInteractionSummaryDto {
    const byType = new Map<string, number>();
    for (const interaction of interactions) {
      byType.set(interaction.type, (byType.get(interaction.type) ?? 0) + 1);
    }
    return { totalCount: interactions.length, byType: Object.fromEntries(byType) };
  }
}
