import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getAttendanceTrendQuerySchema } from '@ecclesia/contracts';
import type { GetAttendanceTrendQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { AttendanceTrendResourceContextGuard } from '../guards/attendance-trend-resource-context.guard';
import { AttendanceTrendService } from '../services/attendance-trend.service';

/** `[Milestone C: Portal Read Models + Analytics]` Phase 4 - see
 * `AttendanceTrendService`'s own doc comment for the full design. */
@Controller('insights')
export class AttendanceTrendController {
  constructor(private readonly attendanceTrendService: AttendanceTrendService) {}

  @Get('attendance-trend')
  @RequirePermission('gatherings.attendance.read')
  @UseGuards(AttendanceTrendResourceContextGuard, RbacGuard)
  getAttendanceTrend(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(getAttendanceTrendQuerySchema)) query: GetAttendanceTrendQuery,
  ) {
    return this.attendanceTrendService.getTrend(actor, query);
  }
}
