import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import { getGroupActivityQuerySchema } from '@ecclesia/contracts';
import type { GetGroupActivityQuery } from '@ecclesia/contracts';

import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { RosterResourceContextGuard } from '../guards/roster-resource-context.guard';
import { GroupActivityService } from '../services/group-activity.service';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /ministry/groups/:groupId/activity` - see
 * `groupActivityResponseSchema`'s own doc comment for the full
 * reasoning. Gated on `ministry.roster.read`, reusing
 * `RosterResourceContextGuard` as-is rather than a near-duplicate guard -
 * both resolve identically ("which Basonta is `:groupId`"), the same
 * "two routes under the same `:groupId` param, same guard" precedent
 * `RosterController`'s own two routes already establish.
 */
@Controller('ministry/groups/:groupId/activity')
export class GroupActivityController {
  constructor(private readonly groupActivityService: GroupActivityService) {}

  @Get()
  @RequirePermission('ministry.roster.read')
  @UseGuards(RosterResourceContextGuard, RbacGuard)
  getActivity(@Param('groupId') groupId: string, @Query(new ZodValidationPipe(getGroupActivityQuerySchema)) query: GetGroupActivityQuery) {
    return this.groupActivityService.getActivity(groupId, new Date(query.from), new Date(query.to));
  }
}
