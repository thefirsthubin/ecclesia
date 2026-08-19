import { Injectable } from '@nestjs/common';
import type {
  GatheringCategoryDto,
  GatheringTypeCategoryMappingListResponseDto,
  GatheringTypeCategoryMappingResponseDto,
  UpsertGatheringTypeCategoryMappingInput,
} from '@ecclesia/contracts';
import type { GatheringTypeCategoryMapping } from '@prisma/client';

import { GatheringTypeCategoryMappingRepository } from '../repositories/gathering-type-category-mapping.repository';

function toResponseDto(mapping: GatheringTypeCategoryMapping): GatheringTypeCategoryMappingResponseDto {
  return {
    id: mapping.id,
    branchId: mapping.branchId,
    gatheringType: mapping.gatheringType,
    category: mapping.category,
    createdAt: mapping.createdAt.toISOString(),
    updatedAt: mapping.updatedAt.toISOString(),
  };
}

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #1's
 * canonical mapping mechanism - orchestrates the `gathering_type_category_mappings`
 * use cases and, critically, the `typesForCategory` lookup every
 * category-aware analytics read-model (giving-trend, attendance-trend)
 * builds on. `Gathering.type` stays a plain, Branch-configurable string;
 * this service is the only place that string is ever translated into a
 * conceptual `GatheringCategory`, and it never guesses - an unmapped
 * configured type is reported as such (`listMappings`), never silently
 * assigned a category.
 */
@Injectable()
export class GatheringTypeCategoryService {
  constructor(private readonly repository: GatheringTypeCategoryMappingRepository) {}

  async upsertMapping(branchId: string, input: UpsertGatheringTypeCategoryMappingInput): Promise<GatheringTypeCategoryMappingResponseDto> {
    const mapping = await this.repository.upsert(branchId, input.gatheringType, input.category);
    return toResponseDto(mapping);
  }

  /** `GET /gatherings/type-category-mappings` - every mapped type, plus
   * every configured type this Branch has that still has no mapping row,
   * so a caller can see exactly what remains ambiguous rather than
   * inferring it from an incomplete list. */
  async listMappings(branchId: string): Promise<GatheringTypeCategoryMappingListResponseDto> {
    const [mappings, configuredTypes] = await Promise.all([
      this.repository.listByBranch(branchId),
      this.repository.findConfiguredGatheringTypes(branchId),
    ]);
    const mappedTypes = new Set(mappings.map((m) => m.gatheringType));
    const unmappedTypes = configuredTypes.filter((type) => !mappedTypes.has(type));
    return { mappings: mappings.map(toResponseDto), unmappedTypes };
  }

  /**
   * The inverse lookup analytics read-models actually need: every
   * configured `Gathering.type` string this Branch has mapped to
   * `category`. Returns an empty array (never a guess) when nothing is
   * mapped to that category yet - the caller (e.g.
   * `AttendanceTrendService`) must then itself decide how to represent
   * "no gatherings of this category exist," not fabricate a result.
   */
  async typesForCategory(branchId: string, category: GatheringCategoryDto): Promise<string[]> {
    const mappings = await this.repository.listByBranch(branchId);
    return mappings.filter((m) => m.category === category).map((m) => m.gatheringType);
  }
}
