import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../services/group-scope.service';

/**
 * Loads the `ResourceContext` for a route acting on an existing Group
 * (`GET/PATCH /v1/groups/:id`). See `GroupScopeService`'s doc comment for
 * the resolution logic (extracted there so Gatherings can reuse it too).
 */
@Injectable()
export class GroupResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    return this.groupScopeService.loadResourceContext(id);
  }
}

/**
 * `POST /v1/groups` has no `:id` to load - PRD §17.3 has no row for Group
 * creation at all (see `people.group.*`'s doc comment in
 * `libs/rbac/src/lib/actions.ts`), and the matrix rows this module
 * inferred grant `people.group.create` only at BRANCH scope
 * (RESIDENT_PASTOR, ADMIN) - deliberately no CLUSTER/OWN_GROUP create
 * grant, since deciding which cluster or leader a brand-new Group belongs
 * to is itself unresolved (`db/DESIGN_NOTES.md` Open Question #1). The
 * resource is therefore trivially "the actor's own Branch," same pattern
 * as `PersonCreateResourceContextGuard`.
 */
@Injectable()
export class GroupCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
