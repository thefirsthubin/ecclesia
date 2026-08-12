import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { BranchDashboardResourceContextGuard, GroupDashboardResourceContextGuard } from '../guards/insights-dashboard-resource-context.guard';
import { AlertService } from '../services/alert.service';
import { BranchDashboardSummaryService } from '../services/branch-dashboard-summary.service';
import { PulseScoreService } from '../services/pulse-score.service';

/**
 * FR-INS-04: role-scoped Insights dashboards (Resident Pastor -> whole
 * Branch, Assistant Pastor -> own cluster, Shepherd -> own Bacenta).
 * Each response embeds both the freshly compute-on-read Church Pulse
 * score (`PulseScoreService`, FR-INS-01) and that same scope's own alert
 * list (§16.6's "Alert inbox" surface - deliberately served per-dashboard
 * here rather than as a separate cross-cutting endpoint; see
 * `INSIGHTS_DESIGN_NOTES.md`).
 *
 * `bacenta-dashboard` and `cluster-dashboard` are near-identical
 * single-Bacenta drill-downs - see `GroupDashboardResourceContextGuard`'s
 * doc comment for why a true multi-Bacenta ranked list (US-G2) is not
 * built this milestone.
 */
@Controller('insights')
export class DashboardController {
  constructor(
    private readonly pulseScoreService: PulseScoreService,
    private readonly alertService: AlertService,
    private readonly groupScopeService: GroupScopeService,
    private readonly branchDashboardSummaryService: BranchDashboardSummaryService,
  ) {}

  @Get('branch-dashboard')
  @RequirePermission('insights.branch_dashboard.read')
  @UseGuards(BranchDashboardResourceContextGuard, RbacGuard)
  async getBranchDashboard(@CurrentActor() actor: ActorContext) {
    const pulseScore = await this.pulseScoreService.computeAndStoreBranchScore(actor.branchId);
    const alerts = await this.alertService.listForScope('BRANCH', actor.branchId);
    return { branchId: actor.branchId, pulseScore, alerts };
  }

  /**
   * `[Resident Pastor Dashboard - real Members/Attendance/Giving data
   * milestone]` Reuses `insights.branch_dashboard.read` verbatim - same
   * actor scope (RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR/ADMIN, BRANCH),
   * same guard chain as `branch-dashboard` immediately above, not a new
   * permission row. `actor.branchId` (resolved server-side from the
   * authenticated actor, via the same guard) is the only Branch id this
   * ever passes down to `BranchDashboardSummaryService` - never a
   * client-supplied parameter.
   */
  @Get('branch-dashboard-summary')
  @RequirePermission('insights.branch_dashboard.read')
  @UseGuards(BranchDashboardResourceContextGuard, RbacGuard)
  getBranchDashboardSummary(@CurrentActor() actor: ActorContext) {
    return this.branchDashboardSummaryService.getSummary(actor.branchId);
  }

  @Get('bacenta-dashboard/:groupId')
  @RequirePermission('insights.bacenta_dashboard.read')
  @UseGuards(GroupDashboardResourceContextGuard, RbacGuard)
  getBacentaDashboard(@Param('groupId') groupId: string) {
    return this.getGroupDashboard(groupId);
  }

  @Get('cluster-dashboard/:groupId')
  @RequirePermission('insights.cluster_dashboard.read')
  @UseGuards(GroupDashboardResourceContextGuard, RbacGuard)
  getClusterDashboard(@Param('groupId') groupId: string) {
    return this.getGroupDashboard(groupId);
  }

  private async getGroupDashboard(groupId: string) {
    // Resolved independently of the guard's own identical lookup - the
    // guard's result is used only for authorization
    // (`EcclesiaRequestContext`, not exposed to controllers) and this
    // service call needs the Group's actual `branchId` (not assumed to
    // equal the actor's own), per `PulseScoreService.computeAndStoreGroupScore`'s
    // signature.
    const scope = await this.groupScopeService.loadResourceContext(groupId);
    const pulseScore = await this.pulseScoreService.computeAndStoreGroupScore(scope.branchId, groupId);
    const alerts = await this.alertService.listForScope('GROUP', groupId);
    return { branchId: scope.branchId, groupId, pulseScore, alerts };
  }
}
