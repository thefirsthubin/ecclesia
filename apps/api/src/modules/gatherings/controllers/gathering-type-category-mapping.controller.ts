import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { upsertGatheringTypeCategoryMappingSchema } from '@ecclesia/contracts';
import type { UpsertGatheringTypeCategoryMappingInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { GatheringTypeCategoryMappingResourceContextGuard } from '../guards/gathering-type-category-mapping-resource-context.guard';
import { GatheringTypeCategoryService } from '../services/gathering-type-category.service';

/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 1 decision #1's
 * canonical mapping mechanism, exposed for administration. Deliberately
 * reuses `platform.configuration.read`/`.update` rather than a new
 * action - this mapping is conceptually a Configuration concern (which
 * Branch-configured Gathering type means which conceptual category), the
 * same action set that already gates `Configuration.gatheringTypes`
 * itself.
 */
@Controller('gatherings/type-category-mappings')
export class GatheringTypeCategoryMappingController {
  constructor(private readonly gatheringTypeCategoryService: GatheringTypeCategoryService) {}

  @Get()
  @RequirePermission('platform.configuration.read')
  @UseGuards(GatheringTypeCategoryMappingResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext) {
    return this.gatheringTypeCategoryService.listMappings(actor.branchId);
  }

  @Post()
  @RequirePermission('platform.configuration.update')
  @UseGuards(GatheringTypeCategoryMappingResourceContextGuard, RbacGuard)
  upsert(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(upsertGatheringTypeCategoryMappingSchema)) body: UpsertGatheringTypeCategoryMappingInput,
  ) {
    return this.gatheringTypeCategoryService.upsertMapping(actor.branchId, body);
  }
}
