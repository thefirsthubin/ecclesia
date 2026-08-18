import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import {
  createOutreachContactSchema,
  promoteOutreachContactSchema,
  updateOutreachContactOutcomeSchema,
} from '@ecclesia/contracts';
import type {
  CreateOutreachContactInput,
  PromoteOutreachContactInput,
  UpdateOutreachContactOutcomeInput,
} from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  OutreachContactCreateResourceContextGuard,
  OutreachContactResourceContextGuard,
} from '../guards/outreach-contact-resource-context.guard';
import { OutreachContactService } from '../services/outreach-contact.service';

/** `[Milestone B: People + Pastoral + Outreach Foundation]` See
 * MILESTONE_B_DESIGN_NOTES.md Part 4/12. */
@Controller('outreach')
export class OutreachContactController {
  constructor(private readonly outreachContactService: OutreachContactService) {}

  @Post(':outreachId/contacts')
  @RequirePermission('outreach.contact.create')
  @UseGuards(OutreachContactCreateResourceContextGuard, RbacGuard)
  addContact(
    @Param('outreachId') outreachId: string,
    @Body(new ZodValidationPipe(createOutreachContactSchema)) body: CreateOutreachContactInput,
  ) {
    return this.outreachContactService.addContact(outreachId, body);
  }

  @Get(':outreachId/contacts')
  @RequirePermission('outreach.contact.read')
  @UseGuards(OutreachContactCreateResourceContextGuard, RbacGuard)
  listForOutreach(@Param('outreachId') outreachId: string) {
    return this.outreachContactService.listForOutreach(outreachId);
  }

  @Patch('contacts/:id/outcome')
  @RequirePermission('outreach.contact.update')
  @UseGuards(OutreachContactResourceContextGuard, RbacGuard)
  updateOutcome(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateOutreachContactOutcomeSchema)) body: UpdateOutreachContactOutcomeInput,
  ) {
    return this.outreachContactService.updateOutcome(id, body);
  }

  /** `[Milestone B]` The lazy-promotion action - see
   * `OutreachContactService.promote`'s own doc comment. Reuses
   * `outreach.contact.update` (setting `personId` is a mutation of the
   * contact record itself), not a new action - `people.person.create`
   * separately gates the actual Person creation this triggers, enforced
   * inside `PersonService.create` itself via its own guard chain on
   * `POST /people` (this route calls that service method directly, not
   * through HTTP, so `PersonCreateResourceContextGuard` does not run
   * here - the actor's own Branch is already established by this route's
   * own guard, matching the same "already-authorized internal call"
   * pattern `VisitorIntakeService.submit` uses for its own `PersonService.create`
   * call).
   */
  @Post('contacts/:id/promote')
  @RequirePermission('outreach.contact.update')
  @UseGuards(OutreachContactResourceContextGuard, RbacGuard)
  promote(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(promoteOutreachContactSchema)) body: PromoteOutreachContactInput,
  ) {
    return this.outreachContactService.promote(actor, id, body);
  }
}
