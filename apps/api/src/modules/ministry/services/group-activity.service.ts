import { Injectable } from '@nestjs/common';
import type { GroupActivityResponseDto } from '@ecclesia/contracts';

import { GatheringScopeService } from '../../gatherings/services/gathering-scope.service';
import { GroupMembershipService } from '../../people/services/group-membership.service';
import { StaffingTargetRepository } from '../repositories/staffing-target.repository';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` "Basonta recent
 * activity" read model - see `groupActivityResponseSchema`'s own doc
 * comment (`libs/contracts/src/lib/ministry.schemas.ts`) for the full
 * reasoning. A pure composition of three already-existing, already-owned
 * facts, fetched via `Promise.all` the same way `PastoralCalendarService`
 * composes its own three sections - `GroupMembership`/`Gathering` are
 * each reached through their owning module's exported "thin passthrough"
 * (`GroupMembershipService.listRecentByGroup`,
 * `GatheringScopeService.listGatheringsForGroup`), not by injecting a
 * foreign module's repository directly; `StaffingTarget` is Ministry's
 * own table, queried directly.
 */
@Injectable()
export class GroupActivityService {
  constructor(
    private readonly groupMembershipService: GroupMembershipService,
    private readonly gatheringScopeService: GatheringScopeService,
    private readonly staffingTargetRepository: StaffingTargetRepository,
  ) {}

  async getActivity(groupId: string, from: Date, to: Date): Promise<GroupActivityResponseDto> {
    const [membershipChanges, gatherings, staffingTargetChanges] = await Promise.all([
      this.groupMembershipService.listRecentByGroup(groupId, from, to),
      this.gatheringScopeService.listGatheringsForGroup(groupId, from, to),
      this.staffingTargetRepository.listByGroupWithCreatedInRange(groupId, from, to),
    ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      membershipChanges: membershipChanges.map((membership) => ({
        personId: membership.personId,
        startedAt: membership.startedAt.toISOString(),
        endedAt: membership.endedAt ? membership.endedAt.toISOString() : null,
        reason: membership.reason ?? null,
      })),
      staffingTargetChanges: staffingTargetChanges.map((target) => ({
        id: target.id,
        gatheringId: target.gatheringId,
        targetCount: target.targetCount,
        createdAt: target.createdAt.toISOString(),
      })),
      gatherings: gatherings.map((gathering) => ({
        id: gathering.id,
        type: gathering.type,
        scheduledStart: gathering.scheduledStart.toISOString(),
      })),
    };
  }
}
