import { Body, Controller, Param, Post } from '@nestjs/common';
import type { ActorContext } from '@ecclesia/rbac';
import { createRoleAssignmentRequestSchema } from '@ecclesia/contracts';
import type { CreateRoleAssignmentRequestInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { RoleAssignmentService } from '../services/role-assignment.service';

/**
 * PRD §17.3 "Role Assignment: grant Shepherd/Worker/etc." row.
 * Deliberately carries no `@RequirePermission`/`RbacGuard` - see
 * `RoleAssignmentService`'s doc comment for why the declarative pipeline
 * cannot express this endpoint's data-dependent action selection
 * (`grant` vs. `grant_shepherd`), and why `evaluate()` is called
 * imperatively inside the service instead. `AuthGuard` (Sprint 1.4's
 * global `APP_GUARD`) still runs and still populates
 * `request.actorContext` regardless - this route is unauthenticated by
 * no guard, only un-declaratively-authorized.
 */
@Controller('people/:personId/role-assignments')
export class RoleAssignmentController {
  constructor(private readonly roleAssignmentService: RoleAssignmentService) {}

  @Post()
  grant(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createRoleAssignmentRequestSchema)) body: CreateRoleAssignmentRequestInput,
  ) {
    return this.roleAssignmentService.grant(actor, personId, body);
  }
}
