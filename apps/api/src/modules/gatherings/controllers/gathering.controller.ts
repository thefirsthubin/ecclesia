import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createGatheringSchema, updateGatheringSchema } from '@ecclesia/contracts';
import type { CreateGatheringInput, UpdateGatheringInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  GatheringCreateResourceContextGuard,
  GatheringResourceContextGuard,
} from '../guards/gathering-resource-context.guard';
import { GatheringService } from '../services/gathering.service';

/** PRD §17.3's "Gathering: create/configure" row, §12.4. */
@Controller('gatherings')
export class GatheringController {
  constructor(private readonly gatheringService: GatheringService) {}

  @Post()
  @RequirePermission('gatherings.gathering.create')
  @UseGuards(GatheringCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createGatheringSchema)) body: CreateGatheringInput) {
    return this.gatheringService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('gatherings.gathering.read')
  @UseGuards(GatheringResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.gatheringService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('gatherings.gathering.update')
  @UseGuards(GatheringResourceContextGuard, RbacGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateGatheringSchema)) body: UpdateGatheringInput) {
    return this.gatheringService.update(id, body);
  }
}
