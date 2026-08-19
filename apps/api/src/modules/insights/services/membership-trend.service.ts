import { BadRequestException, Injectable } from '@nestjs/common';
import { buildTimeBuckets } from '@ecclesia/domain-insights';
import type { GetMembershipTrendQuery, MembershipSnapshotDto, MembershipTrendResponseDto, MembershipTrendResultDto } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { PrismaService } from '../../../platform/database/prisma.service';
import { AttendanceRecordService } from '../../gatherings/services/attendance-record.service';
import { GatheringTypeCategoryService } from '../../gatherings/services/gathering-type-category.service';
import { GroupMembershipService } from '../../people/services/group-membership.service';
import { PersonService } from '../../people/services/person.service';

/** Phase 1 decision #2's locked window - 8 weeks of Sunday attendance
 * defines "active." Not configurable per-request; a Branch-level
 * override would be a new product decision this milestone does not make. */
const ACTIVE_MEMBER_WINDOW_WEEKS = 8;
const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 5's Membership
 * Trend read model, backing `GET /insights/membership-trend`.
 *
 * **Active/inactive, exactly as approved (Phase 1 decision #2):** a
 * Person is active when `lifecycleStage = 'MEMBER'` AND they were
 * `PRESENT` at a SUNDAY-category Gathering (resolved via
 * `GatheringTypeCategoryService`, never guessed from a name) whose own
 * `scheduledStart` falls in the trailing 8 weeks ending "now" - computed
 * by intersecting two id sets (`PersonService.findIdsByBranchAndLifecycleStage('MEMBER')`
 * and `AttendanceRecordService.listDistinctPresentPersonIds`), never by
 * adding a new `lifecycleStage` value. `inactive` is the complement
 * within `MEMBER`, not "everyone who isn't active."
 *
 * **Group/cluster narrowing, honestly scoped.** For a `groupId`/own-
 * cluster request, every count is recomputed against that scope's own
 * current Bacenta roster (`GroupMembershipService.listActivePersonIdsForGroups`)
 * intersected with the relevant lifecycle/attendance id sets - genuine
 * narrowing, not merely an RBAC label. Two fields are **not** narrowed
 * and stay branch-wide even in a scoped request, disclosed rather than
 * silently faked: `peopleWithoutBacentaCount` (a contradiction in terms
 * once already scoped to one Bacenta's own roster - reported as `0`) and
 * `basontaMembershipCount` (Basonta/MINISTRY membership crosses Bacenta-
 * cluster boundaries by this domain's own design - PRD §12.6 - so "my
 * cluster's Basonta membership" has no principled per-cluster answer
 * without a capability this milestone does not build).
 *
 * **No historical active/inactive series** - see
 * `membershipSnapshotSchema`'s own doc comment in `libs/contracts` for
 * why this stays a current-moment snapshot, never bucketed into history.
 */
@Injectable()
export class MembershipTrendService {
  constructor(
    private readonly personService: PersonService,
    private readonly groupMembershipService: GroupMembershipService,
    private readonly attendanceRecordService: AttendanceRecordService,
    private readonly gatheringTypeCategoryService: GatheringTypeCategoryService,
    private readonly prisma: PrismaService,
  ) {}

  async getTrend(actor: ActorContext, query: GetMembershipTrendQuery): Promise<MembershipTrendResponseDto> {
    if (query.council && query.groupId) {
      throw new BadRequestException('Supply at most one of council or groupId, not both');
    }

    const buckets = buildTimeBuckets(query.granularity, query.count, query.endingAt ? new Date(query.endingAt) : undefined);

    if (query.council) {
      if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
        throw new BadRequestException('This actor has no Council scope to aggregate across');
      }
      const councilBranches: (MembershipTrendResultDto & { branchId: string })[] = [];
      for (const branchId of actor.councilBranchIds) {
        const result = await this.prisma.runInBranchScope(branchId, () => this.buildResult(branchId, undefined, buckets));
        councilBranches.push({ branchId, ...result });
      }
      return { councilBranches };
    }

    if (query.groupId) {
      const result = await this.buildResult(actor.branchId, [query.groupId], buckets);
      return { branchId: actor.branchId, ...result };
    }

    const groupIds = this.resolveActorOwnGroupIds(actor);
    const result = await this.buildResult(actor.branchId, groupIds, buckets);
    return { branchId: actor.branchId, ...result };
  }

  private resolveActorOwnGroupIds(actor: ActorContext): string[] | undefined {
    if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      return actor.clusterBacentaIds;
    }
    const ownGroupId = actor.bacentaId ?? actor.basontaId;
    return ownGroupId ? [ownGroupId] : undefined;
  }

  private async buildResult(branchId: string, groupIds: string[] | undefined, buckets: ReturnType<typeof buildTimeBuckets>): Promise<MembershipTrendResultDto> {
    const from = buckets[0].bucketStart;
    const to = buckets[buckets.length - 1].bucketEnd;
    const now = to;

    const [registeredPeopleSeries, membersSeries, snapshot] = await Promise.all([
      this.cumulativeSeries(branchId, groupIds, buckets, undefined),
      this.cumulativeSeries(branchId, groupIds, buckets, 'MEMBER'),
      this.buildSnapshot(branchId, groupIds, now),
    ]);

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      registeredPeopleSeries,
      membersSeries,
      snapshot,
    };
  }

  /** Cumulative "as of this bucket's own end" count, the same
   * `countByBranchCreatedBefore` technique `BranchDashboardSummaryService.growthSeries.membership`
   * already established - honest because `Person` rows are never
   * deleted. Group-scoped requests use the roster id set's own
   * `createdAt` distribution instead (no `countByBranchCreatedBefore`
   * equivalent exists for an arbitrary id set, so this fetches the
   * roster once and filters in-memory - acceptable at this milestone's
   * single-Bacenta/single-cluster data volume). */
  private async cumulativeSeries(
    branchId: string,
    groupIds: string[] | undefined,
    buckets: ReturnType<typeof buildTimeBuckets>,
    lifecycleStage: string | undefined,
  ) {
    if (!groupIds) {
      const counts = await Promise.all(
        buckets.map((bucket) =>
          lifecycleStage
            ? this.countByLifecycleStageCreatedBefore(branchId, lifecycleStage, bucket.bucketEnd)
            : this.personService.countByBranchCreatedBefore(branchId, bucket.bucketEnd),
        ),
      );
      return buckets.map((bucket, index) => ({ label: bucket.label, value: counts[index] }));
    }

    const rosterPersonIds = await this.groupMembershipService.listActivePersonIdsForGroups(groupIds);
    const memberIds = lifecycleStage ? new Set(await this.personService.findIdsByBranchAndLifecycleStage(branchId, lifecycleStage)) : undefined;
    const scopedIds = memberIds ? rosterPersonIds.filter((id) => memberIds.has(id)) : rosterPersonIds;
    const createdAts = await this.personCreatedAts(scopedIds);
    return buckets.map((bucket) => ({
      label: bucket.label,
      value: createdAts.filter((createdAt) => createdAt < bucket.bucketEnd).length,
    }));
  }

  private async countByLifecycleStageCreatedBefore(branchId: string, lifecycleStage: string, cutoffExclusive: Date): Promise<number> {
    const ids = await this.personService.findIdsByBranchAndLifecycleStage(branchId, lifecycleStage);
    const createdAts = await this.personCreatedAts(ids);
    return createdAts.filter((createdAt) => createdAt < cutoffExclusive).length;
  }

  private async personCreatedAts(personIds: string[]): Promise<Date[]> {
    if (personIds.length === 0) {
      return [];
    }
    const persons = await this.personService.getByIds(personIds);
    return persons.map((person) => new Date(person.createdAt));
  }

  private async buildSnapshot(branchId: string, groupIds: string[] | undefined, now: Date): Promise<MembershipSnapshotDto> {
    const windowStart = new Date(now.getTime() - ACTIVE_MEMBER_WINDOW_WEEKS * MILLISECONDS_PER_WEEK);
    const sundayTypes = await this.gatheringTypeCategoryService.typesForCategory(branchId, 'SUNDAY');
    const presentPersonIds = new Set(
      sundayTypes.length > 0 ? await this.attendanceRecordService.listDistinctPresentPersonIds(branchId, windowStart, now, sundayTypes) : [],
    );

    if (!groupIds) {
      const [registeredPeopleCount, membersCount, firstTimersCount, visitorsCount, peopleWithoutBacentaCount, bacentaMembershipCount, basontaMembershipCount, memberIds] =
        await Promise.all([
          this.personService.countByBranch(branchId),
          this.personService.countByBranchAndLifecycleStage(branchId, 'MEMBER'),
          this.personService.countByBranchAndLifecycleStage(branchId, 'FIRST_TIME_GUEST'),
          this.personService.countByBranchAndLifecycleStage(branchId, 'VISITOR'),
          this.personService.countWithoutActiveBacenta(branchId),
          this.groupMembershipService.countDistinctActiveByGroupType(branchId, 'PASTORAL_CARE', now),
          this.groupMembershipService.countDistinctActiveByGroupType(branchId, 'MINISTRY', now),
          this.personService.findIdsByBranchAndLifecycleStage(branchId, 'MEMBER'),
        ]);
      const activeMembersCount = memberIds.filter((id) => presentPersonIds.has(id)).length;
      return {
        registeredPeopleCount,
        membersCount,
        activeMembersCount,
        inactiveMembersCount: membersCount - activeMembersCount,
        activeMemberWindowWeeks: ACTIVE_MEMBER_WINDOW_WEEKS,
        firstTimersCount,
        visitorsCount,
        peopleWithoutBacentaCount,
        bacentaMembershipCount,
        basontaMembershipCount,
      };
    }

    // Group/cluster-scoped: recompute every narrowable count against this
    // scope's own current Bacenta roster - see this class's own doc
    // comment for exactly which two fields stay branch-wide by design.
    const rosterPersonIds = await this.groupMembershipService.listActivePersonIdsForGroups(groupIds);
    const rosterSet = new Set(rosterPersonIds);
    const [memberIdsAll, firstTimerIdsAll, visitorIdsAll] = await Promise.all([
      this.personService.findIdsByBranchAndLifecycleStage(branchId, 'MEMBER'),
      this.personService.findIdsByBranchAndLifecycleStage(branchId, 'FIRST_TIME_GUEST'),
      this.personService.findIdsByBranchAndLifecycleStage(branchId, 'VISITOR'),
    ]);
    const scopedMemberIds = memberIdsAll.filter((id) => rosterSet.has(id));
    const activeMembersCount = scopedMemberIds.filter((id) => presentPersonIds.has(id)).length;

    return {
      registeredPeopleCount: rosterPersonIds.length,
      membersCount: scopedMemberIds.length,
      activeMembersCount,
      inactiveMembersCount: scopedMemberIds.length - activeMembersCount,
      activeMemberWindowWeeks: ACTIVE_MEMBER_WINDOW_WEEKS,
      firstTimersCount: firstTimerIdsAll.filter((id) => rosterSet.has(id)).length,
      visitorsCount: visitorIdsAll.filter((id) => rosterSet.has(id)).length,
      // Not meaningful once already scoped to one/several Bacentas' own
      // roster - see this class's own doc comment.
      peopleWithoutBacentaCount: 0,
      bacentaMembershipCount: rosterPersonIds.length,
      // Branch-wide by design at this scope - see this class's own doc comment.
      basontaMembershipCount: await this.groupMembershipService.countDistinctActiveByGroupType(branchId, 'MINISTRY', now),
    };
  }
}
