import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createGatheringSeriesSchema } from '@ecclesia/contracts';
import type { CreateGatheringSeriesInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  GatheringSeriesCreateResourceContextGuard,
  GatheringSeriesResourceContextGuard,
} from '../guards/gathering-series-resource-context.guard';
import { GatheringSeriesService } from '../services/gathering-series.service';

/** FR-GTH-02, PRD §17.3's "Gathering: create/configure" row (a series is
 * the recurring definition a Gathering instance may reference). */
@Controller('gathering-series')
export class GatheringSeriesController {
  constructor(private readonly gatheringSeriesService: GatheringSeriesService) {}

  @Post()
  @RequirePermission('gatherings.gathering.create')
  @UseGuards(GatheringSeriesCreateResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createGatheringSeriesSchema)) body: CreateGatheringSeriesInput,
  ) {
    return this.gatheringSeriesService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('gatherings.gathering.read')
  @UseGuards(GatheringSeriesResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.gatheringSeriesService.getById(id);
  }
}
