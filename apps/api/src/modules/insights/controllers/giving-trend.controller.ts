import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getGivingTrendQuerySchema } from '@ecclesia/contracts';
import type { GetGivingTrendQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { GivingTrendResourceContextGuard } from '../guards/giving-trend-resource-context.guard';
import { GivingTrendService } from '../services/giving-trend.service';

/** `[Milestone C: Portal Read Models + Analytics]` Phase 3 - see
 * `GivingTrendService`'s own doc comment for the full design. */
@Controller('insights')
export class GivingTrendController {
  constructor(private readonly givingTrendService: GivingTrendService) {}

  @Get('giving-trend')
  @RequirePermission('stewardship.transaction.read')
  @UseGuards(GivingTrendResourceContextGuard, RbacGuard)
  getGivingTrend(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(getGivingTrendQuerySchema)) query: GetGivingTrendQuery) {
    return this.givingTrendService.getTrend(actor, query);
  }
}
