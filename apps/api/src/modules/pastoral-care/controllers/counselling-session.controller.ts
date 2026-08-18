import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createCounsellingSessionSchema, updateCounsellingSessionStatusSchema } from '@ecclesia/contracts';
import type { CreateCounsellingSessionInput, UpdateCounsellingSessionStatusInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  CounsellingSessionResourceContextGuard,
  CounsellingSessionStatusResourceContextGuard,
} from '../guards/counselling-session-resource-context.guard';
import { CounsellingSessionService } from '../services/counselling-session.service';

/** `[Milestone B: People + Pastoral + Outreach Foundation]` See
 * MILESTONE_B_DESIGN_NOTES.md Part 8. */
@Controller('people/:personId/counselling-sessions')
export class CounsellingSessionController {
  constructor(private readonly counsellingSessionService: CounsellingSessionService) {}

  @Post()
  @RequirePermission('pastoral_care.counselling.create')
  @UseGuards(CounsellingSessionResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createCounsellingSessionSchema)) body: CreateCounsellingSessionInput,
  ) {
    return this.counsellingSessionService.create(actor, personId, body);
  }

  @Get()
  @RequirePermission('pastoral_care.counselling.read')
  @UseGuards(CounsellingSessionResourceContextGuard, RbacGuard)
  listByPerson(@Param('personId') personId: string) {
    return this.counsellingSessionService.listByPerson(personId);
  }
}

@Controller('counselling-sessions')
export class CounsellingSessionStatusController {
  constructor(private readonly counsellingSessionService: CounsellingSessionService) {}

  @Patch(':id/status')
  @RequirePermission('pastoral_care.counselling.update')
  @UseGuards(CounsellingSessionStatusResourceContextGuard, RbacGuard)
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCounsellingSessionStatusSchema)) body: UpdateCounsellingSessionStatusInput,
  ) {
    return this.counsellingSessionService.updateStatus(id, body);
  }
}
