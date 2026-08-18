import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import { createGroupMembershipRequestSchema, leaveGroupMembershipSchema } from '@ecclesia/contracts';
import type { CreateGroupMembershipRequestInput, LeaveGroupMembershipInput } from '@ecclesia/contracts';

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

  /** FR-PPL-07's Bacenta/Basonta membership history read - see
   * `libs/rbac/src/lib/actions.ts`'s `people.group_membership.read` doc
   * comment. Reuses the same resource-context guard as the `POST` above,
   * unmodified - both act on "this Person's own scope." */
  @Get()
  @RequirePermission('people.group_membership.read')
  @UseGuards(GroupMembershipResourceContextGuard, RbacGuard)
  listForPerson(@Param('personId') personId: string) {
    return this.groupMembershipService.listForPerson(personId);
  }

  /**
   * `[Milestone B: People + Pastoral + Outreach Foundation]` Closes an
   * active membership with no replacement opened - the "leave" gap
   * MILESTONE_B_DESIGN_NOTES.md Part 3 identified. Reuses
   * `people.group_membership.update`, the same action `assign` above
   * requires - no new RBAC action needed, this is the same capability
   * ("change this Person's Bacenta/Basonta membership state") with a
   * different shape of change.
   */
  @Post('leave')
  @RequirePermission('people.group_membership.update')
  @UseGuards(GroupMembershipResourceContextGuard, RbacGuard)
  leave(
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(leaveGroupMembershipSchema)) body: LeaveGroupMembershipInput,
  ) {
    return this.groupMembershipService.leave(personId, body);
  }
}
