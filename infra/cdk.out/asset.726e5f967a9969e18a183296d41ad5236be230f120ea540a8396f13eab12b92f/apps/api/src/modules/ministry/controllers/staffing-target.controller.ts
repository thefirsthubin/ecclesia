import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createStaffingTargetSchema } from '@ecclesia/contracts';
import type { CreateStaffingTargetInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  StaffingTargetCreateResourceContextGuard,
  StaffingTargetResourceContextGuard,
} from '../guards/staffing-target-resource-context.guard';
import { StaffingTargetService } from '../services/staffing-target.service';

/** FR-MIN-02/03. `create` doubles as "set or correct" (upsert) - see
 * `createStaffingTargetSchema`'s own doc comment. */
@Controller('ministry/staffing-targets')
export class StaffingTargetController {
  constructor(private readonly staffingTargetService: StaffingTargetService) {}

  @Post()
  @RequirePermission('ministry.staffing_target.create')
  @UseGuards(StaffingTargetCreateResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(createStaffingTargetSchema)) body: CreateStaffingTargetInput,
  ) {
    return this.staffingTargetService.create(actor, body);
  }

  @Get(':id')
  @RequirePermission('ministry.staffing_target.read')
  @UseGuards(StaffingTargetResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.staffingTargetService.getById(id);
  }
}
