import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import { listSilentDriftFlagsQuerySchema } from '@ecclesia/contracts';
import type { ListSilentDriftFlagsQuery } from '@ecclesia/contracts';

import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { SilentDriftFlagListResourceContextGuard } from '../guards/silent-drift-flag-resource-context.guard';
import { SilentDriftFlagService } from '../services/silent-drift-flag.service';

/**
 * FR-PC-05/§15.8, §16.2's "silent-drift flags" Key Surface content on the
 * Shepherd's Bacenta dashboard. See
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6 for why this controller did not exist before this sprint -
 * `apps/worker`'s nightly sweep has written `SilentDriftFlag` rows since
 * the Insights milestone, but nothing read them back over HTTP.
 */
@Controller('pastoral-care/groups/:groupId/silent-drift-flags')
export class SilentDriftFlagController {
  constructor(private readonly silentDriftFlagService: SilentDriftFlagService) {}

  @Get()
  @RequirePermission('pastoral_care.silent_drift_flag.read')
  @UseGuards(SilentDriftFlagListResourceContextGuard, RbacGuard)
  listForGroup(
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(listSilentDriftFlagsQuerySchema)) query: ListSilentDriftFlagsQuery,
  ) {
    return this.silentDriftFlagService.listForGroup(groupId, query.status);
  }
}
