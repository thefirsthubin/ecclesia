import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../services/person-scope.service';

/**
 * `POST /v1/people/:personId/group-memberships` - PRD §17.3's
 * "Bacenta/Basonta: reassign member" row (`people.group_membership.update`).
 * The resource being scoped is the *Person's current membership state*
 * (their existing Bacenta, if any) - the same resolution
 * `PersonResourceContextGuard` already does, reused via the shared
 * `PersonScopeService` rather than duplicated.
 */
@Injectable()
export class GroupMembershipResourceContextGuard extends EcclesiaContextGuardBase {
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
