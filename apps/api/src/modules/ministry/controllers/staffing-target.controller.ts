import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createStaffingTargetSchema } from '@ecclesia/contracts';
import type { CreateStaffingTargetInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  StaffingTargetCreateResourceContextGuard,
  StaffingTargetListResourceContextGuard,
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

  /**
   * `[Remaining Engineering Sprint, Milestone 11]` `GET
   * /ministry/staffing-targets?groupId=` - the Staffing Overview list the
   * Web Admin Staffing Targets UI needs (`MINISTRY_PAGE_DESIGN_NOTES.md`'s
   * disclosed gap). Declared before `:id`, the same readability convention
   * every other module's list + getById pair follows - the two paths never
   * actually collide (this route has no path segment after
   * `staffing-targets`, `:id` requires one), so ordering here is only a
   * convention, not a correctness requirement.
   */
  @Get()
  @RequirePermission('ministry.staffing_target.read')
  @UseGuards(StaffingTargetListResourceContextGuard, RbacGuard)
  list(@Query('groupId') groupId?: string) {
    if (!groupId) {
      throw new NotFoundException("Query must include a 'groupId'");
    }
    return this.staffingTargetService.listByGroup(groupId);
  }

  @Get(':id')
  @RequirePermission('ministry.staffing_target.read')
  @UseGuards(StaffingTargetResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.staffingTargetService.getById(id);
  }
}
