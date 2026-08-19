import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getPastoralActivitySummaryQuerySchema } from '@ecclesia/contracts';
import type { GetPastoralActivitySummaryQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PastoralActivitySummaryResourceContextGuard } from '../guards/pastoral-activity-summary-resource-context.guard';
import { PastoralActivitySummaryService } from '../services/pastoral-activity-summary.service';

/**
 * `[Milestone C.1.3: Pastoral Activity Analytics]` `GET
 * /pastoral-care/activity-summary` - gated on
 * `pastoral_care.interaction.read`, matching `PastoralCalendarController`'s
 * own precedent (the most restrictive of the three composed pastoral
 * actions - see `PastoralActivitySummaryService`'s own doc comment for
 * the full reasoning).
 */
@Controller('pastoral-care/activity-summary')
export class PastoralActivitySummaryController {
  constructor(private readonly pastoralActivitySummaryService: PastoralActivitySummaryService) {}

  @Get()
  @RequirePermission('pastoral_care.interaction.read')
  @UseGuards(PastoralActivitySummaryResourceContextGuard, RbacGuard)
  getSummary(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(getPastoralActivitySummaryQuerySchema)) query: GetPastoralActivitySummaryQuery,
  ) {
    return this.pastoralActivitySummaryService.getSummary(actor, new Date(query.from), new Date(query.to));
  }
}
