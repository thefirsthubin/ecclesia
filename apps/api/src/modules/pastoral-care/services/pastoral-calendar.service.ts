import { Injectable } from '@nestjs/common';
import type { PastoralCalendarResponseDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { CounsellingSessionRepository } from '../repositories/counselling-session.repository';
import { FollowUpTaskRepository } from '../repositories/follow-up-task.repository';
import { MemberInteractionRepository } from '../repositories/member-interaction.repository';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation, Slice 7 -
 * Pastoral Calendar]` A pure composition read-model, not a new table -
 * MILESTONE_B_DESIGN_NOTES.md Part 10's explicit instruction to avoid a
 * duplicate scheduling system. Aggregates three already-existing
 * date-bearing facts: `FollowUpTask.dueAt`, `CounsellingSession.scheduledAt`,
 * `MemberInteraction.scheduledAt`.
 *
 * **Scope note, disclosed rather than silently worked around.** This
 * queries by `actor.branchId` alone for every section, the same "list
 * everything in my Branch, with no separate Cluster-narrowing query"
 * shape `FollowUpTaskListForActorResourceContextGuard`'s own existing
 * `{ branchId: actor.branchId }`-only resolution already establishes for
 * `GET /pastoral-care/follow-up-tasks` (no `groupId`) - an
 * `ASSISTANT_PASTOR` calling that endpoint today already sees the whole
 * Branch, not just their own Cluster, because no repository method in
 * this codebase narrows a Branch-wide list by `clusterBacentaIds`. This
 * endpoint inherits that exact same, already-accepted limitation rather
 * than solving a harder problem this milestone did not set out to solve.
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
  ) {}

  async getCalendar(actor: ActorContext, from: Date, to: Date): Promise<PastoralCalendarResponseDto> {
    const [followUpTasks, counsellingSessions, interactions] = await Promise.all([
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
}
