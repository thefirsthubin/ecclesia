import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createFollowUpTaskSchema, escalateFollowUpTaskSchema } from '@ecclesia/contracts';
import type { CreateFollowUpTaskInput, EscalateFollowUpTaskInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  FollowUpTaskCreateResourceContextGuard,
  FollowUpTaskResourceContextGuard,
} from '../guards/follow-up-task-resource-context.guard';
import { FollowUpTaskService } from '../services/follow-up-task.service';

/** FR-PC-03/FR-PC-04. */
@Controller()
export class FollowUpTaskController {
  constructor(private readonly followUpTaskService: FollowUpTaskService) {}

  @Post('people/:personId/follow-up-tasks')
  @RequirePermission('pastoral_care.followup_task.create')
  @UseGuards(FollowUpTaskCreateResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createFollowUpTaskSchema)) body: CreateFollowUpTaskInput,
  ) {
    return this.followUpTaskService.create(actor, personId, body);
  }

  @Get('follow-up-tasks/:id')
  @RequirePermission('pastoral_care.followup_task.read')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.followUpTaskService.getById(id);
  }

  @Patch('follow-up-tasks/:id/complete')
  @RequirePermission('pastoral_care.followup_task.update')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  complete(@Param('id') id: string) {
    return this.followUpTaskService.complete(id);
  }

  @Patch('follow-up-tasks/:id/escalate')
  @RequirePermission('pastoral_care.followup_task.update')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  escalate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(escalateFollowUpTaskSchema)) body: EscalateFollowUpTaskInput,
  ) {
    return this.followUpTaskService.escalate(id, body.escalatedToPersonId);
  }
}
