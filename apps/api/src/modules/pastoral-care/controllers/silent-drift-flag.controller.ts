import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { listSilentDriftFlagsForActorQuerySchema, listSilentDriftFlagsQuerySchema } from '@ecclesia/contracts';
import type { ListSilentDriftFlagsForActorQuery, ListSilentDriftFlagsQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  SilentDriftFlagListForActorResourceContextGuard,
  SilentDriftFlagListResourceContextGuard,
} from '../guards/silent-drift-flag-resource-context.guard';
import { SilentDriftFlagService } from '../services/silent-drift-flag.service';

/**
 * FR-PC-05/§15.8, §16.2's "silent-drift flags" Key Surface content on the
 * Shepherd's Bacenta dashboard. See
 * `apps/mobile/.../ShepherdDashboard/SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * STEP 6 for why this controller did not exist before this sprint -
 * `apps/worker`'s nightly sweep has written `SilentDriftFlag` rows since
 * the Insights milestone, but nothing read them back over HTTP.
 *
 * `[Silent-Drift Detection Branch-wide milestone]` `GET
 * /pastoral-care/silent-drift-flags` (declared before the `:groupId`
 * sub-path below only for readability, same non-load-bearing convention
 * `PersonController.list`/`GatheringController.list` already follow) adds
 * the BRANCH-wide/optional-`groupId` counterpart the workflow matrix
 * named as missing - `pastoral_care.silent_drift_flag.read`'s
 * BRANCH-scope rows (Resident Pastor, Admin) previously had no route that
 * could ever satisfy them without already knowing every Group id in the
 * Branch, the identical gap Follow-up Tasks had before its own
 * `GET /pastoral-care/follow-up-tasks` was added.
 */
@Controller('pastoral-care')
export class SilentDriftFlagController {
  constructor(private readonly silentDriftFlagService: SilentDriftFlagService) {}

  @Get('silent-drift-flags')
  @RequirePermission('pastoral_care.silent_drift_flag.read')
  @UseGuards(SilentDriftFlagListForActorResourceContextGuard, RbacGuard)
  list(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(listSilentDriftFlagsForActorQuerySchema)) query: ListSilentDriftFlagsForActorQuery,
  ) {
    return this.silentDriftFlagService.list(actor, query);
  }

  @Get('groups/:groupId/silent-drift-flags')
  @RequirePermission('pastoral_care.silent_drift_flag.read')
  @UseGuards(SilentDriftFlagListResourceContextGuard, RbacGuard)
  listForGroup(
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(listSilentDriftFlagsQuerySchema)) query: ListSilentDriftFlagsQuery,
  ) {
    return this.silentDriftFlagService.listForGroup(groupId, query.status);
  }
}
