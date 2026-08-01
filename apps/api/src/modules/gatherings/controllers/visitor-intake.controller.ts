import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { submitVisitorIntakeSchema } from '@ecclesia/contracts';
import type { SubmitVisitorIntakeInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { VisitorIntakeResourceContextGuard } from '../guards/visitor-intake-resource-context.guard';
import { VisitorIntakeService } from '../services/visitor-intake.service';

/** FR-GTH-04/BR-GTH-03 - [INFERRED - no PRD §17.3 row covers this, see
 * `libs/rbac/src/lib/actions.ts`'s `gatherings.visitor_intake.*` doc
 * comment]. */
@Controller('visitor-intake')
export class VisitorIntakeController {
  constructor(private readonly visitorIntakeService: VisitorIntakeService) {}

  @Post()
  @RequirePermission('gatherings.visitor_intake.create')
  @UseGuards(VisitorIntakeResourceContextGuard, RbacGuard)
  submit(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(submitVisitorIntakeSchema)) body: SubmitVisitorIntakeInput,
  ) {
    return this.visitorIntakeService.submit(actor, body);
  }
}
