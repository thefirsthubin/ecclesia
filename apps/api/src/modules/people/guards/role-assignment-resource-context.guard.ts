import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../services/person-scope.service';

/**
 * `GET /people/:personId/role-assignments` (People Web Admin sprint,
 * FR-PPL-07's role-history read). The `POST` route on this same
 * controller carries no guard at all (see `RoleAssignmentService`'s own
 * doc comment for why - the grant action is data-dependent on
 * `request.body.role`); reading history has no such wrinkle, so this
 * follows the ordinary declarative pattern every other read route uses -
 * same resource resolution `GroupMembershipResourceContextGuard` already
 * uses for the sibling `people/:personId/group-memberships` route (the
 * resource being scoped is the target Person's own scope, via the shared
 * `PersonScopeService`).
 */
@Injectable()
export class RoleAssignmentResourceContextGuard extends EcclesiaContextGuardBase {
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
