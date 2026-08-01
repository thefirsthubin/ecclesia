import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
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
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService);
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
    private readonly followUpTaskRepository: FollowUpTaskRepository,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService);
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
