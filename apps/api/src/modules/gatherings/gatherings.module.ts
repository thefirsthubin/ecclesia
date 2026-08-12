import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PastoralCareModule } from '../pastoral-care/pastoral-care.module';
import { PeopleModule } from '../people/people.module';
import { AttendanceRecordController } from './controllers/attendance-record.controller';
import { GatheringController } from './controllers/gathering.controller';
import { GatheringSeriesController } from './controllers/gathering-series.controller';
import { VisitorIntakeController } from './controllers/visitor-intake.controller';
import { AttendanceResourceContextGuard } from './guards/attendance-resource-context.guard';
import {
  GatheringCreateResourceContextGuard,
  GatheringListResourceContextGuard,
  GatheringResourceContextGuard,
} from './guards/gathering-resource-context.guard';
import {
  GatheringSeriesCreateResourceContextGuard,
  GatheringSeriesResourceContextGuard,
} from './guards/gathering-series-resource-context.guard';
import { VisitorIntakeResourceContextGuard } from './guards/visitor-intake-resource-context.guard';
import { AttendanceRecordRepository } from './repositories/attendance-record.repository';
import { GatheringRepository } from './repositories/gathering.repository';
import { GatheringSeriesRepository } from './repositories/gathering-series.repository';
import { VisitorIntakeRepository } from './repositories/visitor-intake.repository';
import { AttendanceRecordService } from './services/attendance-record.service';
import { GatheringService } from './services/gathering.service';
import { GatheringSeriesService } from './services/gathering-series.service';
import { GatheringScopeService } from './services/gathering-scope.service';
import { VisitorIntakeService } from './services/visitor-intake.service';

/**
 * GatheringsModule (PRD §13.4 / Blueprint §4.2 module inventory) - the
 * third bounded-context module. Internal layout mirrors
 * `PeopleModule`/`PastoralCareModule`'s own doc comments.
 *
 * Imports both `PeopleModule` (for `PersonService`, `PersonScopeService`,
 * `GroupScopeService`, `GroupLeadershipService`) and `PastoralCareModule`
 * (for `FollowUpTaskService`, consumed by `VisitorIntakeService`) as
 * ordinary imports, not `forwardRef` - unlike People and Pastoral Care,
 * which need each other's services and therefore import each other,
 * neither People nor Pastoral Care needs anything from Gatherings, so
 * there is no cycle here to break.
 *
 * **Exports `GatheringScopeService`** (Ministry milestone) - the first
 * time this module exports anything. `StaffingTargetService`
 * (`apps/api/src/modules/ministry`, FR-MIN-02) needs to validate that a
 * client-supplied `gatheringId` exists and belongs to the same Branch as
 * the target Basonta before writing a `StaffingTarget` row. See
 * `MinistryModule`'s own doc comment and
 * `apps/api/src/modules/ministry/MINISTRY_DESIGN_NOTES.md`.
 *
 * **Also exports `AttendanceRecordService`** (Resident Pastor Dashboard -
 * real Attendance data milestone) - `BranchDashboardSummaryService`
 * (`apps/api/src/modules/insights`) needs `countPresentInWindow` for the
 * Attendance KPI/trend/growth-series, the same "small, purpose-built
 * public method" cross-module pattern every export above already
 * follows, not a new architectural exception.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, EventsModule, PeopleModule, PastoralCareModule],
  controllers: [GatheringSeriesController, GatheringController, AttendanceRecordController, VisitorIntakeController],
  providers: [
    GatheringSeriesRepository,
    GatheringRepository,
    AttendanceRecordRepository,
    VisitorIntakeRepository,
    GatheringSeriesService,
    GatheringService,
    GatheringScopeService,
    AttendanceRecordService,
    VisitorIntakeService,
    GatheringSeriesCreateResourceContextGuard,
    GatheringSeriesResourceContextGuard,
    GatheringCreateResourceContextGuard,
    GatheringResourceContextGuard,
    GatheringListResourceContextGuard,
    AttendanceResourceContextGuard,
    VisitorIntakeResourceContextGuard,
  ],
  exports: [GatheringScopeService, AttendanceRecordService],
})
export class GatheringsModule {}
