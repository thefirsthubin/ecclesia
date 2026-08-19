import { Injectable } from '@nestjs/common';
import type { GatheringCategory, GatheringTypeCategoryMapping } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

/**
 * `[Milestone C: Portal Read Models + Analytics]` Prisma-backed
 * persistence for `gatherings.gathering_type_category_mappings` (Phase 1
 * decision #1). Also reads `platform.configurations.gathering_types`
 * directly - shared platform infrastructure, not another bounded
 * context's private schema, the same precedent
 * `FinancialTransactionRepository.findUserIdByPersonId`'s own doc comment
 * already establishes for `platform.users`.
 */
@Injectable()
export class GatheringTypeCategoryMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One row per `(branchId, gatheringType)` - `@@unique` enforced,
   * upserted rather than create-only, since re-mapping an already-mapped
   * type (a correction) is expected, not an error. */
  upsert(branchId: string, gatheringType: string, category: GatheringCategory): Promise<GatheringTypeCategoryMapping> {
    return this.prisma.gatheringTypeCategoryMapping.upsert({
      where: { branchId_gatheringType: { branchId, gatheringType } },
      create: { branchId, gatheringType, category },
      update: { category },
    });
  }

  listByBranch(branchId: string): Promise<GatheringTypeCategoryMapping[]> {
    return this.prisma.gatheringTypeCategoryMapping.findMany({
      where: { branchId },
      orderBy: { gatheringType: 'asc' },
    });
  }

  /** The Branch's own configured Gathering type strings
   * (`Configuration.gatheringTypes`) - the universe `unmappedTypes`
   * (`GatheringTypeCategoryService.listMappings`) is computed against.
   * Empty array, not an error, when the Branch has no `Configuration`
   * row at all (matches `Configuration?` being optional on `Branch`). */
  async findConfiguredGatheringTypes(branchId: string): Promise<string[]> {
    const configuration = await this.prisma.configuration.findUnique({
      where: { branchId },
      select: { gatheringTypes: true },
    });
    return configuration?.gatheringTypes ?? [];
  }
}
