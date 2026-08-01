import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import { createGroupMembershipRequestSchema } from '@ecclesia/contracts';
import type { CreateGroupMembershipRequestInput } from '@ecclesia/contracts';

import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { GroupMembershipResourceContextGuard } from '../guards/group-membership-resource-context.guard';
import { GroupMembershipService } from '../services/group-membership.service';

/**
 * PRD §17.3 "Bacenta/Basonta: reassign member" row. Also the entry point
 * for PRD §19.1 step 6 (opening a Bacenta membership for a Person in
 * `FOLLOW_UP` automatically advances their lifecycle stage) - see
 * `GroupMembershipService`.
 */
@Controller('people/:personId/group-memberships')
export class GroupMembershipController {
  constructor(private readonly groupMembershipService: GroupMembershipService) {}

  @Post()
  @RequirePermission('people.group_membership.update')
  @UseGuards(GroupMembershipResourceContextGuard, RbacGuard)
  assign(
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createGroupMembershipRequestSchema)) body: CreateGroupMembershipRequestInput,
  ) {
    return this.groupMembershipService.assign(personId, body);
  }
}
