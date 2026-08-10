import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { PersonScopeService } from '../../people/services/person-scope.service';
import { FollowUpTaskRepository } from '../repositories/follow-up-task.repository';

/**
 * `POST /v1/people/:personId/follow-up-tasks` - the resource is "the
 * subject Person," resolved via People's exported `PersonScopeService`
 * (same pattern as `PoimenEnrollmentResourceContextGuard`).
 */
@Injectable()
export class FollowUpTaskCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const personId = (request.params as Record<string, string>).personId;
    return this.personScopeService.loadResourceContext(personId, actor);
  }
}

/**
 * `GET/PATCH /v1/follow-up-tasks/:id` (read, complete, escalate) - loads
 * the existing task first (to find its subject `personId`), then resolves
 * scope from that Person's perspective via `PersonScopeService`, the same
 * "subject Person defines the scope" resolution `create` uses.
 */
@Injectable()
export class FollowUpTaskResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly followUpTaskRepository: FollowUpTaskRepository,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const task = await this.followUpTaskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`No Follow-up task found with id '${id}'`);
    }
    return this.personScopeService.loadResourceContext(task.personId, actor);
  }
}

/**
 * `GET /pastoral-care/groups/:groupId/follow-up-tasks` (Shepherd
 * Dashboard sprint's Priority-card queue, §16.2's "Follow-up task queue"
 * surface). Group-scoped, not per-task - resolves `ResourceContext`
 * straight from the `:groupId` route param via People's exported
 * `GroupScopeService`, the identical pattern
 * `GroupDashboardResourceContextGuard` (`apps/api/src/modules/insights`)
 * already established for `GET /insights/bacenta-dashboard/:groupId`.
 */
@Injectable()
export class FollowUpTaskListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.params as Record<string, string>).groupId;
    return this.groupScopeService.loadResourceContext(groupId);
  }
}

/**
 * `GET /pastoral-care/follow-up-tasks` (Pastoral Care Web Admin sprint).
 * Identical shape to People's `PersonListResourceContextGuard`: a
 * `groupId` query param means an OWN_GROUP/CLUSTER-scoped actor named
 * their own Group (resolved via `GroupScopeService`, same as the
 * path-param guard above); its absence falls back to the actor's own
 * Branch, satisfying `pastoral_care.followup_task.read`'s BRANCH-scope
 * rows (Resident Pastor, Admin) with no Group to name.
 */
@Injectable()
export class FollowUpTaskListForActorResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.query as Record<string, string>).groupId;
    if (groupId) {
      return this.groupScopeService.loadResourceContext(groupId);
    }
    return Promise.resolve({ branchId: actor.branchId });
  }
}
