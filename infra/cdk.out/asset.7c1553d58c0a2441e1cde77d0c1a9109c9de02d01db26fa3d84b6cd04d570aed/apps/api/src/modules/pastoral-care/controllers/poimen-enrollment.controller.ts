import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { updatePoimenStatusSchema } from '@ecclesia/contracts';
import type { UpdatePoimenStatusInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { PoimenEnrollmentResourceContextGuard } from '../guards/poimen-enrollment-resource-context.guard';
import { PoimenEnrollmentService } from '../services/poimen-enrollment.service';

/**
 * FR-PC-06 - [INFERRED - no PRD §17.3 row covers this, see
 * `libs/rbac/src/lib/actions.ts`'s `pastoral_care.poimen_enrollment.*`
 * doc comment].
 */
@Controller('people/:personId/poimen-enrollment')
export class PoimenEnrollmentController {
  constructor(private readonly poimenEnrollmentService: PoimenEnrollmentService) {}

  @Post()
  @RequirePermission('pastoral_care.poimen_enrollment.create')
  @UseGuards(PoimenEnrollmentResourceContextGuard, RbacGuard)
  enroll(@CurrentActor() actor: ActorContext, @Param('personId') personId: string) {
    return this.poimenEnrollmentService.enroll(actor, personId);
  }

  @Get()
  @RequirePermission('pastoral_care.poimen_enrollment.read')
  @UseGuards(PoimenEnrollmentResourceContextGuard, RbacGuard)
  getByPersonId(@Param('personId') personId: string) {
    return this.poimenEnrollmentService.getByPersonId(personId);
  }

  @Patch()
  @RequirePermission('pastoral_care.poimen_enrollment.update')
  @UseGuards(PoimenEnrollmentResourceContextGuard, RbacGuard)
  updateStatus(
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(updatePoimenStatusSchema)) body: UpdatePoimenStatusInput,
  ) {
    return this.poimenEnrollmentService.updateStatus(personId, body.status);
  }
}
