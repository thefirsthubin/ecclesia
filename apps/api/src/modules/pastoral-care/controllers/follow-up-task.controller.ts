import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import {
  createFollowUpTaskSchema,
  escalateFollowUpTaskSchema,
  listFollowUpTasksForActorQuerySchema,
  listFollowUpTasksQuerySchema,
} from '@ecclesia/contracts';
import type {
  CreateFollowUpTaskInput,
  EscalateFollowUpTaskInput,
  ListFollowUpTasksForActorQuery,
  ListFollowUpTasksQuery,
} from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  FollowUpTaskCreateResourceContextGuard,
  FollowUpTaskListForActorResourceContextGuard,
  FollowUpTaskListResourceContextGuard,
  FollowUpTaskResourceContextGuard,
} from '../guards/follow-up-task-resource-context.guard';
import { FollowUpTaskService } from '../services/follow-up-task.service';

/** FR-PC-03/FR-PC-04. */
@Controller()
export class FollowUpTaskController {
  constructor(private readonly followUpTaskService: FollowUpTaskService) {}

  @Post('people/:personId/follow-up-tasks')
  @RequirePermission('pastoral_care.followup_task.create')
  @UseGuards(FollowUpTaskCreateResourceContextGuard, RbacGuard)
  create(
    @CurrentActor() actor: ActorContext,
    @Param('personId') personId: string,
    @Body(new ZodValidationPipe(createFollowUpTaskSchema)) body: CreateFollowUpTaskInput,
  ) {
    return this.followUpTaskService.create(actor, personId, body);
  }

  /** `GET /people/:personId/follow-up-tasks` - `[Branch Pastor portal,
   * Pastoral Care sprint]` the "People -> Member -> Pastoral Care"
   * direction, the counterpart to `PastoralNoteController`'s own
   * `GET /people/:personId/pastoral-notes`. Reuses the create route's own
   * guard - both resolve the identical "subject Person defines the
   * scope" resource context - and the existing `pastoral_care.followup_task.read`
   * action; no new permission-matrix row. */
  @Get('people/:personId/follow-up-tasks')
  @RequirePermission('pastoral_care.followup_task.read')
  @UseGuards(FollowUpTaskCreateResourceContextGuard, RbacGuard)
  listByPerson(@Param('personId') personId: string) {
    return this.followUpTaskService.listByPerson(personId);
  }

  /** §16.2's "Follow-up task queue... sorted by SLA urgency" - Shepherd
   * Dashboard sprint's Priority card. See
   * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6 for why this endpoint did
   * not exist before this sprint. */
  @Get('pastoral-care/groups/:groupId/follow-up-tasks')
  @RequirePermission('pastoral_care.followup_task.read')
  @UseGuards(FollowUpTaskListResourceContextGuard, RbacGuard)
  listForGroup(
    @Param('groupId') groupId: string,
    @Query(new ZodValidationPipe(listFollowUpTasksQuerySchema)) query: ListFollowUpTasksQuery,
  ) {
    return this.followUpTaskService.listForGroup(groupId, query.status);
  }

  /** `GET /pastoral-care/follow-up-tasks` (Pastoral Care Web Admin sprint)
   * - the BRANCH-wide/optional-`groupId` counterpart to `listForGroup`
   * above, mirroring `PersonController.list`'s `GET /people` exactly. See
   * `PASTORAL_CARE_DESIGN_NOTES.md`'s "Resolved (Pastoral Care Web Admin
   * sprint)" section. */
  @Get('pastoral-care/follow-up-tasks')
  @RequirePermission('pastoral_care.followup_task.read')
  @UseGuards(FollowUpTaskListForActorResourceContextGuard, RbacGuard)
  list(
    @CurrentActor() actor: ActorContext,
    @Query(new ZodValidationPipe(listFollowUpTasksForActorQuerySchema)) query: ListFollowUpTasksForActorQuery,
  ) {
    return this.followUpTaskService.list(actor, query);
  }

  @Get('follow-up-tasks/:id')
  @RequirePermission('pastoral_care.followup_task.read')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.followUpTaskService.getById(id);
  }

  @Patch('follow-up-tasks/:id/complete')
  @RequirePermission('pastoral_care.followup_task.update')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  complete(@Param('id') id: string) {
    return this.followUpTaskService.complete(id);
  }

  @Patch('follow-up-tasks/:id/escalate')
  @RequirePermission('pastoral_care.followup_task.update')
  @UseGuards(FollowUpTaskResourceContextGuard, RbacGuard)
  escalate(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(escalateFollowUpTaskSchema)) body: EscalateFollowUpTaskInput,
  ) {
    return this.followUpTaskService.escalate(id, body.escalatedToPersonId);
  }
}
