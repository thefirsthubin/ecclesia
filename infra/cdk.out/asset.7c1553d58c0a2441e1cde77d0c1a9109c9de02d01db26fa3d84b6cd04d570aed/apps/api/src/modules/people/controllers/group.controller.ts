import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { createGroupSchema, listGroupsQuerySchema, updateGroupSchema } from '@ecclesia/contracts';
import type { CreateGroupInput, ListGroupsQuery, UpdateGroupInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  GroupCreateResourceContextGuard,
  GroupListResourceContextGuard,
  GroupResourceContextGuard,
} from '../guards/group-resource-context.guard';
import { GroupService } from '../services/group.service';

/**
 * [INFERRED - no PRD §17.3 row covers this] Group (Bacenta/Basonta)
 * creation/configuration - FR-PC-01, FR-MIN-01. See
 * `libs/rbac/src/lib/actions.ts`'s `people.group.*` doc comment for why
 * these permission actions/rules had to be inferred rather than cited.
 */
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  @RequirePermission('people.group.create')
  @UseGuards(GroupCreateResourceContextGuard, RbacGuard)
  create(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(createGroupSchema)) body: CreateGroupInput) {
    return this.groupService.create(actor, body);
  }

  /** `GET /groups` (Ministry Web Admin sprint's Basonta directory).
   * Declared before `:id`, same readability convention `PersonController.list`
   * already follows - not required for correctness. */
  @Get()
  @RequirePermission('people.group.read')
  @UseGuards(GroupListResourceContextGuard, RbacGuard)
  list(@CurrentActor() actor: ActorContext, @Query(new ZodValidationPipe(listGroupsQuerySchema)) query: ListGroupsQuery) {
    return this.groupService.list(actor, query);
  }

  @Get(':id')
  @RequirePermission('people.group.read')
  @UseGuards(GroupResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.groupService.getById(id);
  }

  @Patch(':id')
  @RequirePermission('people.group.update')
  @UseGuards(GroupResourceContextGuard, RbacGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateGroupSchema)) body: UpdateGroupInput) {
    return this.groupService.update(id, body);
  }
}
