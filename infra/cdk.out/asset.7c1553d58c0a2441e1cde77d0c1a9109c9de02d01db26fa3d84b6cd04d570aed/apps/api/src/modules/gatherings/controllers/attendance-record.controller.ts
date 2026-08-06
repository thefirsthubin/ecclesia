import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { recordAttendanceSchema } from '@ecclesia/contracts';
import type { RecordAttendanceInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { AttendanceResourceContextGuard } from '../guards/attendance-resource-context.guard';
import { AttendanceRecordService } from '../services/attendance-record.service';

/** PRD §17.3's "Attendance: record" row, FR-GTH-03/FR-GTH-05. */
@Controller('gatherings/:gatheringId/attendance-records')
export class AttendanceRecordController {
  constructor(private readonly attendanceRecordService: AttendanceRecordService) {}

  @Post()
  @RequirePermission('gatherings.attendance.create')
  @UseGuards(AttendanceResourceContextGuard, RbacGuard)
  record(
    @CurrentActor() actor: ActorContext,
    @Param('gatheringId') gatheringId: string,
    @Body(new ZodValidationPipe(recordAttendanceSchema)) body: RecordAttendanceInput,
  ) {
    return this.attendanceRecordService.record(actor, gatheringId, body);
  }

  @Get()
  @RequirePermission('gatherings.attendance.read')
  @UseGuards(AttendanceResourceContextGuard, RbacGuard)
  listByGathering(@Param('gatheringId') gatheringId: string) {
    return this.attendanceRecordService.listByGathering(gatheringId);
  }

  /** FR-GTH-05, per-Gathering. See `AttendanceRecordService`'s doc
   * comment for why the Branch-wide sweep/report isn't built here. */
  @Get('completeness')
  @RequirePermission('gatherings.attendance.read')
  @UseGuards(AttendanceResourceContextGuard, RbacGuard)
  checkCompleteness(@Param('gatheringId') gatheringId: string) {
    return this.attendanceRecordService.checkCompleteness(gatheringId);
  }
}
