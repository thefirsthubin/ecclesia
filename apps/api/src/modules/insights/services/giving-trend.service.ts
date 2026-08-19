import { BadRequestException, Injectable } from '@nestjs/common';
import { buildTimeBuckets } from '@ecclesia/domain-insights';
import type { TimeBucket } from '@ecclesia/domain-insights';
import type {
  GetGivingTrendQuery,
  GivingTrendBucketDto,
  GivingTrendResponseDto,
  GivingTrendResultDto,
} from '@ecclesia/contracts';
import { FINANCIAL_TRANSACTION_TYPE_VALUES } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { FinancialTransactionType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';
import { GatheringTypeCategoryService } from '../../gatherings/services/gathering-type-category.service';
import { FinancialTransactionService } from '../../stewardship/services/financial-transaction.service';
import type { VerifiedTransactionForTrendRow } from '../../stewardship/repositories/financial-transaction.repository';

/** Every `FinancialTransactionType` except `EXPENSE` - Phase 3's explicit
 * "EXPENSE must never appear in giving analytics" instruction, enforced
 * here as the actual default filter, not merely documented. */
const GIVING_TYPES = FINANCIAL_TRANSACTION_TYPE_VALUES.filter((type) => type !== 'EXPENSE') as FinancialTransactionType[];

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 3's Giving Trend
 * read model, backing `GET /insights/giving-trend`. Composes
 * `FinancialTransactionService.listVerifiedForTrend` (Stewardship) and
 * `GatheringTypeCategoryService.typesForCategory` (Gatherings) the same
 * cross-module way `BranchDashboardSummaryService` already composes
 * three domains for the existing dashboard summary - no new
 * architectural pattern.
 *
 * **Never guesses.** A transaction's date is its linked Gathering's
 * `scheduledStart` when `gatheringId` is set, `createdAt` only when it
 * isn't (Phase 3's explicit instruction) - resolved per-row in
 * `bucketRows`, never inferred from anything else. A transaction with
 * neither `gatheringId` nor `sourceGroupId` is `unattributedAmountMinor`,
 * reported once for the whole window, never folded into a bucket or
 * silently dropped (Phase 1 decision #5). A `gatheringCategory` filter
 * only ever matches rows whose linked Gathering's own `type` string has
 * an explicit `GatheringTypeCategoryMapping` row - an encountered,
 * unmapped type is named in `unmappedGatheringTypes`, never silently
 * excluded without a trace.
 */
@Injectable()
export class GivingTrendService {
  constructor(
    private readonly financialTransactionService: FinancialTransactionService,
    private readonly gatheringTypeCategoryService: GatheringTypeCategoryService,
    private readonly prisma: PrismaService,
  ) {}

  async getTrend(actor: ActorContext, query: GetGivingTrendQuery): Promise<GivingTrendResponseDto> {
    if (query.council && query.groupId) {
      throw new BadRequestException('Supply at most one of council or groupId, not both');
    }

    const buckets = buildTimeBuckets(query.granularity, query.count, query.endingAt ? new Date(query.endingAt) : undefined);
    const types = query.type ? [query.type] : GIVING_TYPES;

    if (query.council) {
      if (!actor.councilBranchIds || actor.councilBranchIds.length === 0) {
        throw new BadRequestException('This actor has no Council scope to aggregate across');
      }
      const councilBranches: (GivingTrendResultDto & { branchId: string })[] = [];
      // Sequential, not Promise.all - each iteration opens its own
      // Prisma interactive transaction (`runInBranchScope`), the same
      // "N sequential connections, not N simultaneous ones" discipline
      // `PrismaService.runInCouncilScope`'s own doc comment already
      // establishes for this exact shape of loop.
      for (const branchId of actor.councilBranchIds) {
        const result = await this.prisma.runInBranchScope(branchId, () =>
          this.buildResultForGroups(branchId, undefined, buckets, types, query.gatheringCategory),
        );
        councilBranches.push({ branchId, ...result });
      }
      return { councilBranches };
    }

    if (query.groupId) {
      const result = await this.buildResultForGroups(actor.branchId, [query.groupId], buckets, types, query.gatheringCategory);
      return { branchId: actor.branchId, ...result };
    }

    const groupIds = this.resolveActorOwnGroupIds(actor);
    const result = await this.buildResultForGroups(actor.branchId, groupIds, buckets, types, query.gatheringCategory);
    return { branchId: actor.branchId, ...result };
  }

  /** OWN_GROUP-scoped actors (Bacenta/Basonta Leader) narrow to their one
   * group; CLUSTER-scoped actors (Assistant Pastor) narrow to their
   * whole cluster; a BRANCH-scoped actor (Resident Pastor, Admin,
   * Treasurer) has neither, so `undefined` means "the whole Branch,"
   * matching `FinancialTransactionRepository.listVerifiedForTrend`'s own
   * `sourceGroupIds?` contract. */
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
    types: FinancialTransactionType[],
    gatheringCategory: GetGivingTrendQuery['gatheringCategory'],
  ): Promise<GivingTrendResultDto> {
    const from = buckets[0].bucketStart;
    const to = buckets[buckets.length - 1].bucketEnd;
    const rows = await this.financialTransactionService.listVerifiedForTrend(branchId, from, to, types, groupIds);

    let allowedGatheringTypes: Set<string> | undefined;
    if (gatheringCategory) {
      const typesForCategory = await this.gatheringTypeCategoryService.typesForCategory(branchId, gatheringCategory);
      allowedGatheringTypes = new Set(typesForCategory);
    }

    const unattributedRows = rows.filter((row) => !row.gatheringId && !row.sourceGroupId);
    const unattributedAmountMinor = unattributedRows.reduce((sum, row) => sum + row.amountMinor, 0n);

    const unmappedGatheringTypes = new Set<string>();
    const bucketRows = rows.filter((row) => {
      if (!allowedGatheringTypes) {
        return true;
      }
      if (!row.gathering) {
        // No Gathering to categorize at all - not a "category" match,
        // and not reported as unmapped (there is no type string to name).
        return false;
      }
      if (allowedGatheringTypes.has(row.gathering.type)) {
        return true;
      }
      unmappedGatheringTypes.add(row.gathering.type);
      return false;
    });

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      buckets: this.bucketize(buckets, bucketRows),
      unattributedAmountMinor: unattributedAmountMinor.toString(),
      unmappedGatheringTypes: Array.from(unmappedGatheringTypes),
    };
  }

  /** Resolves each row's true date (Gathering.scheduledStart when
   * `gatheringId` is set, `createdAt` otherwise - Phase 3's explicit
   * instruction), places it in the one bucket whose `[bucketStart,
   * bucketEnd)` window contains that date, and sums by type within each
   * bucket. A row whose resolved date falls outside every bucket (can
   * happen at the edges of the `OR` window `listVerifiedForTrend`
   * queries, which unions two different date fields) is silently
   * excluded from the totals - correct, not a bug: it was never really
   * inside `[from, to]` for its own true date. */
  private bucketize(buckets: TimeBucket[], rows: VerifiedTransactionForTrendRow[]): GivingTrendBucketDto[] {
    return buckets.map((bucket) => {
      let totalAmountMinor = 0n;
      const byType: Partial<Record<FinancialTransactionType, bigint>> = {};
      for (const row of rows) {
        const date = row.gathering ? row.gathering.scheduledStart : row.createdAt;
        if (date < bucket.bucketStart || date >= bucket.bucketEnd) {
          continue;
        }
        totalAmountMinor += row.amountMinor;
        byType[row.type] = (byType[row.type] ?? 0n) + row.amountMinor;
      }
      const byTypeDto: Record<string, string> = {};
      for (const [type, amount] of Object.entries(byType)) {
        byTypeDto[type] = amount.toString();
      }
      return {
        bucketStart: bucket.bucketStart.toISOString(),
        bucketEnd: bucket.bucketEnd.toISOString(),
        label: bucket.label,
        totalAmountMinor: totalAmountMinor.toString(),
        byType: byTypeDto,
      };
    });
  }
}
