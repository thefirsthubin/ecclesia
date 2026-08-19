import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { getMembershipTrendQuerySchema } from '@ecclesia/contracts';
import type { GetMembershipTrendQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { MembershipTrendResourceContextGuard } from '../guards/membership-trend-resource-context.guard';
import { MembershipTrendService } from '../services/membership-trend.service';

/** `[Milestone C: Portal Read Models + Analytics]` Phase 5 - see
 * `MembershipTrendService`'s own doc comment for the full design. */
@Controller('insights')
export class MembershipTrendController {
  constructor(private readonly membershipTrendService: MembershipTrendService) {}

  @Get('membership-trend')
  @RequirePermission('people.person.read')
  @UseGuards(MembershipTrendResourceContextGuard, RbacGuard)
  getMembershipTrend(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(getMembershipTrendQuerySchema)) query: GetMembershipTrendQuery,
  ) {
    return this.membershipTrendService.getTrend(actor, query);
  }
}
