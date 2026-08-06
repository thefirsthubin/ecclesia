import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createPledgeSchema, fulfillPledgeSchema } from '@ecclesia/contracts';
import type { CreatePledgeInput, FulfillPledgeInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PledgeCreateResourceContextGuard, PledgeResourceContextGuard } from '../guards/pledge-resource-context.guard';
import { PledgeService } from '../services/pledge.service';

/** [INFERRED - no PRD §17.3 row, H2] FR-STW-08. */
@Controller('pledges')
export class PledgeController {
  constructor(private readonly pledgeService: PledgeService) {}

  @Post()
  @RequirePermission('stewardship.pledge.create')
  @UseGuards(PledgeCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createPledgeSchema)) body: CreatePledgeInput) {
    return this.pledgeService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('stewardship.pledge.read')
  @UseGuards(PledgeResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.pledgeService.getById(id);
  }

  @Post(':id/fulfill')
  @RequirePermission('stewardship.pledge.fulfill')
  @UseGuards(PledgeResourceContextGuard, RbacGuard)
  fulfill(@Param('id') id: string, @Body(new ZodValidationPipe(fulfillPledgeSchema)) body: FulfillPledgeInput) {
    return this.pledgeService.fulfill(id, body);
  }
}
