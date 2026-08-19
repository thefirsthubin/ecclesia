import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { PastoralCareModule } from '../pastoral-care/pastoral-care.module';
import { PeopleModule } from '../people/people.module';
import { AttendanceRecordController } from './controllers/attendance-record.controller';
import { GatheringController } from './controllers/gathering.controller';
import { GatheringSeriesController } from './controllers/gathering-series.controller';
import { GatheringTypeCategoryMappingController } from './controllers/gathering-type-category-mapping.controller';
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
import { GatheringTypeCategoryMappingResourceContextGuard } from './guards/gathering-type-category-mapping-resource-context.guard';
import { VisitorIntakeResourceContextGuard } from './guards/visitor-intake-resource-context.guard';
import { AttendanceRecordRepository } from './repositories/attendance-record.repository';
import { GatheringRepository } from './repositories/gathering.repository';
import { GatheringSeriesRepository } from './repositories/gathering-series.repository';
import { GatheringTypeCategoryMappingRepository } from './repositories/gathering-type-category-mapping.repository';
import { VisitorIntakeRepository } from './repositories/visitor-intake.repository';
import { AttendanceRecordService } from './services/attendance-record.service';
import { GatheringService } from './services/gathering.service';
import { GatheringSeriesService } from './services/gathering-series.service';
import { GatheringScopeService } from './services/gathering-scope.service';
import { GatheringTypeCategoryService } from './services/gathering-type-category.service';
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
  // `[Milestone C]` `GatheringTypeCategoryMappingController`'s literal
  // `/gatherings/type-category-mappings` route must be registered before
  // `GatheringController`'s `/gatherings/:id` - Nest resolves routes in
  // controller-registration order, and a `:id` wildcard registered first
  // swallows a later-registered literal segment under the same prefix
  // (confirmed live: `GET /gatherings/type-category-mappings` 500'd,
  // `GatheringResourceContextGuard` tried to `findUnique({ id:
  // 'type-category-mappings' })`, a real cross-controller instance of the
  // same route-ordering hazard this codebase has already hit once before,
  // within a single controller's own route list).
  controllers: [
    GatheringTypeCategoryMappingController,
    GatheringSeriesController,
    GatheringController,
    AttendanceRecordController,
    VisitorIntakeController,
  ],
  providers: [
    GatheringSeriesRepository,
    GatheringRepository,
    AttendanceRecordRepository,
    VisitorIntakeRepository,
    GatheringTypeCategoryMappingRepository,
    GatheringSeriesService,
    GatheringService,
    GatheringScopeService,
    AttendanceRecordService,
    VisitorIntakeService,
    GatheringTypeCategoryService,
    GatheringSeriesCreateResourceContextGuard,
    GatheringSeriesResourceContextGuard,
    GatheringCreateResourceContextGuard,
    GatheringResourceContextGuard,
    GatheringListResourceContextGuard,
    AttendanceResourceContextGuard,
    VisitorIntakeResourceContextGuard,
    GatheringTypeCategoryMappingResourceContextGuard,
  ],
  // `[Milestone C: Portal Read Models + Analytics]` `GatheringTypeCategoryService`
  // is also exported - `AttendanceTrendService`/`GivingTrendService`
  // (`apps/api/src/modules/insights`/`stewardship`) both need
  // `typesForCategory` to resolve which configured Gathering type strings
  // a requested category means, the same "small, purpose-built public
  // method" cross-module pattern `AttendanceRecordService`'s own export
  // already establishes.
  exports: [GatheringScopeService, AttendanceRecordService, GatheringTypeCategoryService],
})
export class GatheringsModule {}
