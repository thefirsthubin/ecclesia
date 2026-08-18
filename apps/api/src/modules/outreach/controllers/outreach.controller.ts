import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createOutreachSchema, listOutreachQuerySchema } from '@ecclesia/contracts';
import type { CreateOutreachInput, ListOutreachQuery } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  OutreachCreateResourceContextGuard,
  OutreachListResourceContextGuard,
  OutreachResourceContextGuard,
} from '../guards/outreach-resource-context.guard';
import { OutreachService } from '../services/outreach.service';

/** `[Milestone B: People + Pastoral + Outreach Foundation]` See
 * MILESTONE_B_DESIGN_NOTES.md Part 4/12. */
@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreachService: OutreachService) {}

  @Post()
  @RequirePermission('outreach.event.create')
  @UseGuards(OutreachCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createOutreachSchema)) body: CreateOutreachInput) {
    return this.outreachService.create(actor, body);
  }

  @Get()
  @RequirePermission('outreach.event.read')
  @UseGuards(OutreachListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(listOutreachQuerySchema)) query: ListOutreachQuery) {
    return this.outreachService.list(actor, query);
  }

  @Get(':id')
  @RequirePermission('outreach.event.read')
  @UseGuards(OutreachResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.outreachService.getById(id);
  }
}
