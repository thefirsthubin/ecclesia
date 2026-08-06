import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { recordWorkerAvailabilitySchema } from '@ecclesia/contracts';
import type { RecordWorkerAvailabilityInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { WorkerAvailabilityResourceContextGuard } from '../guards/worker-availability-resource-context.guard';
import { WorkerAvailabilityService } from '../services/worker-availability.service';

/** §16.3 H2's worker availability self-service surface. */
@Controller('ministry/worker-availability')
export class WorkerAvailabilityController {
  constructor(private readonly workerAvailabilityService: WorkerAvailabilityService) {}

  @Post()
  @RequirePermission('ministry.worker_availability.create')
  @UseGuards(WorkerAvailabilityResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(recordWorkerAvailabilitySchema)) body: RecordWorkerAvailabilityInput,
  ) {
    return this.workerAvailabilityService.create(actor, body);
  }

  @Get()
  @RequirePermission('ministry.worker_availability.read')
  @UseGuards(WorkerAvailabilityResourceContextGuard, RbacGuard)
  listMine(@CurrentActor() actor: ActorContext) {
    return this.workerAvailabilityService.listForActor(actor);
  }
}
