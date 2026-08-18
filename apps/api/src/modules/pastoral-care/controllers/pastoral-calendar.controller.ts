import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getPastoralCalendarQuerySchema } from '@ecclesia/contracts';
import type { GetPastoralCalendarQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PastoralCalendarResourceContextGuard } from '../guards/pastoral-calendar-resource-context.guard';
import { PastoralCalendarService } from '../services/pastoral-calendar.service';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation, Slice 7 -
 * Pastoral Calendar]` `GET /pastoral-care/calendar` - gated on
 * `pastoral_care.interaction.read`, the most restrictive of the three
 * domains this composes (Resident Pastor/Assistant Pastor only) - see
 * `PastoralCalendarService`'s own doc comment for the full reasoning.
 */
@Controller('pastoral-care/calendar')
export class PastoralCalendarController {
  constructor(private readonly pastoralCalendarService: PastoralCalendarService) {}

  @Get()
  @RequirePermission('pastoral_care.interaction.read')
  @UseGuards(PastoralCalendarResourceContextGuard, RbacGuard)
  getCalendar(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(getPastoralCalendarQuerySchema)) query: GetPastoralCalendarQuery) {
    return this.pastoralCalendarService.getCalendar(actor, new Date(query.from), new Date(query.to));
  }
}
