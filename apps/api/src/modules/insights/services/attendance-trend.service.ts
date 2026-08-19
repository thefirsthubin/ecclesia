import { BadRequestException, Injectable } from '@nestjs/common';
import { buildTimeBuckets } from '@ecclesia/domain-insights';
import type { TimeBucket } from '@ecclesia/domain-insights';
import type {
  AttendanceTrendBucketDto,
  AttendanceTrendResponseDto,
  AttendanceTrendResultDto,
  GetAttendanceTrendQuery,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';

import { PrismaService } from '../../../platform/database/prisma.service';
import { AttendanceRecordService } from '../../gatherings/services/attendance-record.service';
import { GatheringTypeCategoryService } from '../../gatherings/services/gathering-type-category.service';
import type { AttendanceForTrendRow } from '../../gatherings/repositories/attendance-record.repository';
import { GroupMembershipService } from '../../people/services/group-membership.service';

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 4's Attendance
 * Trend read model, backing `GET /insights/attendance-trend`. Same
 * composition shape as `GivingTrendService` (bucketing utility +
 * `GatheringTypeCategoryService.typesForCategory` for the category
 * filter + a sequential per-Branch loop for Council scope) - see that
 * service's own doc comment for the shared reasoning.
 *
 * `[Milestone C.1, C.1.4 - Attendance Scope Correction]` Own-group/
 * cluster narrowing previously filtered only by `Gathering.ownerGroupId
 * IN (...)`, which can never match a Branch-wide Gathering (Sunday/
 * Midweek/Other, `ownerGroupId: null`) - a genuine, disclosed gap: a
 * CLUSTER-scoped actor's Sunday attendance numbers were silently always
 * `0`, not "cluster-scoped," even though the request succeeded. Fixed by
 * also resolving the scope's own current roster
 * (`GroupMembershipService.listActivePersonIdsForGroups`, the identical
 * primitive the Pastoral Calendar's own cluster fix already established)
 * and passing it to `AttendanceRecordRepository.listPresentForTrend` as
 * `personIds` - a record now counts if the Gathering it belongs to is
 * owned by the scope's own group(s) **or** the attending Person is a
 * member of the scope's own roster, so a Bacenta/Basonta meeting and a
 * Branch-wide service are both genuinely narrowed, not just the former.
 */
@Injectable()
export class AttendanceTrendService {
  constructor(
    private readonly attendanceRecordService: AttendanceRecordService,
    private readonly gatheringTypeCategoryService: GatheringTypeCategoryService,
    private readonly groupMembershipService: GroupMembershipService,
    private readonly prisma: PrismaService,
  ) {}

  async getTrend(actor: ActorContext, query: GetAttendanceTrendQuery): Promise<AttendanceTrendResponseDto> {
    if (query.council && query.groupId) {
      throw new BadRequestException('Supply at most one of council or groupId, not both');
    }

    const buckets = buildTimeBuckets(query.granularity, query.count, query.endingAt ? new Date(query.endingAt) : undefined);

    if (query.council) {
      if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
        throw new BadRequestException('This actor has no Council scope to aggregate across');
      }
      const councilBranches: (AttendanceTrendResultDto & { branchId: string })[] = [];
      for (const branchId of actor.councilBranchIds) {
        const result = await this.prisma.runInBranchScope(branchId, () =>
          this.buildResultForGroups(branchId, undefined, buckets, query.gatheringCategory),
        );
        councilBranches.push({ branchId, ...result });
      }
      return { councilBranches };
    }

    if (query.groupId) {
      const result = await this.buildResultForGroups(actor.branchId, [query.groupId], buckets, query.gatheringCategory);
      return { branchId: actor.branchId, ...result };
    }

    const groupIds = this.resolveActorOwnGroupIds(actor);
    const result = await this.buildResultForGroups(actor.branchId, groupIds, buckets, query.gatheringCategory);
    return { branchId: actor.branchId, ...result };
  }

  private resolveActorOwnGroupIds(actor: ActorContext): string[] | undefined {
    if (actor.clusterBacentaIds && actor.clusterBacentaIds.length > 0) {
      return actor.clusterBacentaIds;
    }
    const ownGroupId = actor.bacentaId ?? actor.basontaId;
    return ownGroupId ? [ownGroupId] : undefined;
  }

  private async buildResultForGroups(
    branchId: string,
    groupIds: string[] | undefined,
    buckets: TimeBucket[],
    gatheringCategory: GetAttendanceTrendQuery['gatheringCategory'],
  ): Promise<AttendanceTrendResultDto> {
    const from = buckets[0].bucketStart;
    const to = buckets[buckets.length - 1].bucketEnd;

    // `[C.1.4]` When narrowed to a scope's own group(s), also resolve that
    // scope's current Bacenta roster, so a Branch-wide Gathering attended
    // by one of the scope's own people is counted too - see this class's
    // own doc comment for the full reasoning.
    const personIds = groupIds ? await this.groupMembershipService.listActivePersonIdsForGroups(groupIds) : undefined;

    // Fetched unfiltered by type (unlike a plain "all gatherings" query
    // would need to be) specifically so a `gatheringCategory` filter can
    // be applied in application code, the same `GivingTrendService`
    // pattern - the only way to also know which encountered types were
    // *not* in the requested category, for `unmappedGatheringTypes`,
    // rather than having the SQL `IN` clause silently exclude them with
    // no trace.
    const rows = await this.attendanceRecordService.listPresentForTrend(branchId, from, to, undefined, groupIds, personIds);

    let filteredRows = rows;
    const unmappedGatheringTypes = new Set<string>();
    if (gatheringCategory) {
      const allowedTypes = new Set(await this.gatheringTypeCategoryService.typesForCategory(branchId, gatheringCategory));
      filteredRows = rows.filter((row) => {
        if (!row.gathering) {
          return false;
        }
        if (allowedTypes.has(row.gathering.type)) {
          return true;
        }
        unmappedGatheringTypes.add(row.gathering.type);
        return false;
      });
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      buckets: this.bucketize(buckets, filteredRows),
      byGroup: this.groupBreakdown(filteredRows),
      unmappedGatheringTypes: Array.from(unmappedGatheringTypes),
    };
  }

  private bucketize(buckets: TimeBucket[], rows: AttendanceForTrendRow[]): AttendanceTrendBucketDto[] {
    return buckets.map((bucket) => ({
      bucketStart: bucket.bucketStart.toISOString(),
      bucketEnd: bucket.bucketEnd.toISOString(),
      label: bucket.label,
      presentCount: rows.filter((row) => row.recordedAt >= bucket.bucketStart && row.recordedAt < bucket.bucketEnd).length,
    }));
  }

  /** Phase 4's "also support group-level attendance aggregation" -
   * present-count for the whole queried window, per owning Group. Rows
   * whose Gathering has no `ownerGroupId` (a Branch-wide service) are
   * excluded here - there is no single Group to attribute them to. */
  private groupBreakdown(rows: AttendanceForTrendRow[]) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const groupId = row.gathering?.ownerGroupId;
      if (!groupId) {
        continue;
      }
      counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([groupId, presentCount]) => ({ groupId, presentCount }));
  }
}
