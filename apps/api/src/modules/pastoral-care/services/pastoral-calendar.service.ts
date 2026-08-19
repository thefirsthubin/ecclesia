import { Injectable } from '@nestjs/common';
import type { PastoralCalendarResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { CounsellingSession, FollowUpTask, MemberInteraction } from '@prisma/client';

import { GroupMembershipService } from '../../people/services/group-membership.service';
import { CounsellingSessionRepository } from '../repositories/counselling-session.repository';
import { FollowUpTaskRepository } from '../repositories/follow-up-task.repository';
import { MemberInteractionRepository } from '../repositories/member-interaction.repository';

type CalendarSections = [FollowUpTask[], CounsellingSession[], MemberInteraction[]];

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation, Slice 7 -
 * Pastoral Calendar]` A pure composition read-model, not a new table -
 * MILESTONE_B_DESIGN_NOTES.md Part 10's explicit instruction to avoid a
 * duplicate scheduling system. Aggregates three already-existing
 * date-bearing facts: `FollowUpTask.dueAt`, `CounsellingSession.scheduledAt`,
 * `MemberInteraction.scheduledAt`.
 *
 * `[Milestone C: Portal Read Models + Analytics, Phase 1 decision #11]`
 * This service previously queried by `actor.branchId` alone for every
 * section regardless of the actor's real scope - a disclosed limitation
 * at the time, since no repository method existed to narrow a list by
 * `clusterBacentaIds`. That primitive now exists
 * (`FollowUpTaskRepository.listByGroupsWithDueAtInRange`,
 * `GroupMembershipService.listActivePersonIdsForGroups` +
 * `CounsellingSessionRepository`/`MemberInteractionRepository`'s own new
 * `listScheduledInRangeForPersons`), so a CLUSTER-scoped actor
 * (`actor.clusterBacentaIds` populated - Assistant Pastor) now genuinely
 * sees only their own cluster's activity, never the whole Branch. A
 * BRANCH-scoped actor (Resident Pastor) is unaffected - unchanged
 * Branch-wide behavior. `FollowUpTask` is narrowed directly by its own
 * `groupId` column; `CounsellingSession`/`MemberInteraction` carry no
 * `groupId` at all, so narrowing them instead resolves the cluster's
 * current Bacenta membership roster first, then filters by `personId`.
 * The endpoint itself is still gated to `pastoral_care.interaction.read`
 * (Resident Pastor/Assistant Pastor only, per this domain's RBAC) at the
 * controller layer.
 */
@Injectable()
export class PastoralCalendarService {
  constructor(
    private readonly followUpTaskRepository: FollowUpTaskRepository,
    private readonly counsellingSessionRepository: CounsellingSessionRepository,
    private readonly memberInteractionRepository: MemberInteractionRepository,
    private readonly groupMembershipService: GroupMembershipService,
  ) {}

  async getCalendar(actor: ActorContext, from: Date, to: Date): Promise<PastoralCalendarResponseDto> {
    const clusterGroupIds = actor.clusterBacentaIds;
    const [followUpTasks, counsellingSessions, interactions] =
      clusterGroupIds && clusterGroupIds.length > 0
        ? await this.getClusterScopedSections(clusterGroupIds, from, to)
        : await Promise.all([
            this.followUpTaskRepository.listByBranchWithDueAtInRange(actor.branchId, from, to),
            this.counsellingSessionRepository.listScheduledInRange(actor.branchId, from, to),
            this.memberInteractionRepository.listScheduledInRange(actor.branchId, from, to),
          ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      followUpTasks: followUpTasks.map((task) => ({
        id: task.id,
        personId: task.personId,
        dueAt: task.dueAt ? task.dueAt.toISOString() : null,
        priority: task.priority,
        status: task.status,
      })),
      counsellingSessions: counsellingSessions.map((session) => ({
        id: session.id,
        personId: session.personId,
        scheduledAt: session.scheduledAt.toISOString(),
        status: session.status,
      })),
      interactions: interactions.map((interaction) => ({
        id: interaction.id,
        personId: interaction.personId,
        scheduledAt: interaction.scheduledAt ? interaction.scheduledAt.toISOString() : null,
        type: interaction.type,
      })),
    };
  }

  /** `[Milestone C]` The real per-row cluster narrowing behind Phase 1
   * decision #11's fix - see this class's own doc comment. Resolves the
   * cluster's current Bacenta membership roster once, then reuses it for
   * both `CounsellingSession`/`MemberInteraction` (personId-filtered);
   * `FollowUpTask` is narrowed directly by its own `groupId` column, no
   * personId roster needed. */
  private async getClusterScopedSections(clusterGroupIds: string[], from: Date, to: Date): Promise<CalendarSections> {
    const personIds = await this.groupMembershipService.listActivePersonIdsForGroups(clusterGroupIds);
    return Promise.all([
      this.followUpTaskRepository.listByGroupsWithDueAtInRange(clusterGroupIds, from, to),
      this.counsellingSessionRepository.listScheduledInRangeForPersons(personIds, from, to),
      this.memberInteractionRepository.listScheduledInRangeForPersons(personIds, from, to),
    ]);
  }
}
