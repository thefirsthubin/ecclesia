import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createMemberInteractionSchema } from '@ecclesia/contracts';
import type { CreateMemberInteractionInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { MemberInteractionResourceContextGuard } from '../guards/member-interaction-resource-context.guard';
import { MemberInteractionService } from '../services/member-interaction.service';

/** `[Milestone B: People + Pastoral + Outreach Foundation]` Pastor-only
 * (approved decision) - see the explicit absence of any BACENTA_LEADER/
 * BASONTA_LEADER row for `pastoral_care.interaction.*` in
 * `libs/rbac/src/lib/permission-matrix.ts`. MILESTONE_B_DESIGN_NOTES.md
 * Part 9. */
@Controller('people/:personId/interactions')
export class MemberInteractionController {
  constructor(private readonly memberInteractionService: MemberInteractionService) {}

  @Post()
  @RequirePermission('pastoral_care.interaction.create')
  @UseGuards(MemberInteractionResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createMemberInteractionSchema)) body: CreateMemberInteractionInput,
  ) {
    return this.memberInteractionService.create(actor, personId, body);
  }

  @Get()
  @RequirePermission('pastoral_care.interaction.read')
  @UseGuards(MemberInteractionResourceContextGuard, RbacGuard)
  listByPerson(@Param('personId') personId: string) {
    return this.memberInteractionService.listByPerson(personId);
  }
}
