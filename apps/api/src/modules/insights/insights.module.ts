import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../platform/database/database.module';
import { EventsModule } from '../../platform/events/events.module';
import { RbacPlatformModule } from '../../platform/rbac/rbac-platform.module';
import { GatheringsModule } from '../gatherings/gatherings.module';
import { OutreachModule } from '../outreach/outreach.module';
import { PeopleModule } from '../people/people.module';
import { StewardshipModule } from '../stewardship/stewardship.module';
import { AlertController } from './controllers/alert.controller';
import { AttendanceTrendController } from './controllers/attendance-trend.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { GivingTrendController } from './controllers/giving-trend.controller';
import { MembershipTrendController } from './controllers/membership-trend.controller';
import { OutreachConversionController } from './controllers/outreach-conversion.controller';
import { AlertResourceContextGuard } from './guards/alert-resource-context.guard';
import { AttendanceTrendResourceContextGuard } from './guards/attendance-trend-resource-context.guard';
import { GivingTrendResourceContextGuard } from './guards/giving-trend-resource-context.guard';
import { BranchDashboardResourceContextGuard, GroupDashboardResourceContextGuard } from './guards/insights-dashboard-resource-context.guard';
import { MembershipTrendResourceContextGuard } from './guards/membership-trend-resource-context.guard';
import { OutreachConversionResourceContextGuard } from './guards/outreach-conversion-resource-context.guard';
import { AlertRepository } from './repositories/alert.repository';
import { EngagementSignalRepository } from './repositories/engagement-signal.repository';
import { PulseScoreHistoryRepository } from './repositories/pulse-score-history.repository';
import { PulseScoreRepository } from './repositories/pulse-score.repository';
import { AlertService } from './services/alert.service';
import { AttendanceTrendService } from './services/attendance-trend.service';
import { BranchDashboardSummaryService } from './services/branch-dashboard-summary.service';
import { EngagementSignalService } from './services/engagement-signal.service';
import { GivingTrendService } from './services/giving-trend.service';
import { MembershipTrendService } from './services/membership-trend.service';
import { OutreachConversionService } from './services/outreach-conversion.service';
import { PulseScoreService } from './services/pulse-score.service';

/**
 * InsightsModule (PRD §13.6 / Blueprint §4.2 module inventory) - the
 * fifth bounded-context module, and (per `app.module.ts`'s own prior doc
 * comment) the last of the six before Ministry. Internal layout mirrors
 * `StewardshipModule`'s own doc comment.
 *
 * Imports `PeopleModule` as an ordinary import (no `forwardRef`) for
 * `GroupScopeService` - the third bounded-context consumer of that
 * cross-module service after Gatherings and Stewardship.
 *
 * Exports `EngagementSignalService` - unlike every other module built so
 * far, this is deliberately made available for cross-module/future
 * consumption: it is the landing point a future `apps/worker` Engagement
 * Signal consumer (Blueprint Ch.4's EventBridge/SQS bus, which does not
 * exist yet - see `INSIGHTS_DESIGN_NOTES.md`) would call, and in
 * principle any other bounded-context module could call it directly too
 * once that architecture is in place. No route in this module calls it -
 * see `EngagementSignalService`'s own doc comment for why it has no
 * controller.
 *
 * `[Resident Pastor Dashboard - real Members/Attendance/Giving data
 * milestone]` Also imports `GatheringsModule` and `StewardshipModule` -
 * `BranchDashboardSummaryService`'s own real dependencies
 * (`AttendanceRecordService`, `FinancialTransactionService`). Both are
 * ordinary imports, not `forwardRef`: neither module imports
 * `InsightsModule` back (confirmed by reading both modules' own `imports`
 * arrays before adding this), so there is no cycle to break, the same
 * "ordinary import" reasoning `GatheringsModule`'s own doc comment already
 * gives for its own People/Pastoral Care imports.
 */
@Module({
  imports: [DatabaseModule, RbacPlatformModule, EventsModule, PeopleModule, GatheringsModule, StewardshipModule, OutreachModule],
  controllers: [
    DashboardController,
    AlertController,
    GivingTrendController,
    AttendanceTrendController,
    MembershipTrendController,
    OutreachConversionController,
  ],
  providers: [
    EngagementSignalRepository,
    PulseScoreRepository,
    PulseScoreHistoryRepository,
    AlertRepository,
    EngagementSignalService,
    AlertService,
    PulseScoreService,
    BranchDashboardSummaryService,
    GivingTrendService,
    AttendanceTrendService,
    MembershipTrendService,
    OutreachConversionService,
    BranchDashboardResourceContextGuard,
    GroupDashboardResourceContextGuard,
    AlertResourceContextGuard,
    GivingTrendResourceContextGuard,
    AttendanceTrendResourceContextGuard,
    MembershipTrendResourceContextGuard,
    OutreachConversionResourceContextGuard,
  ],
  exports: [EngagementSignalService],
})
export class InsightsModule {}
