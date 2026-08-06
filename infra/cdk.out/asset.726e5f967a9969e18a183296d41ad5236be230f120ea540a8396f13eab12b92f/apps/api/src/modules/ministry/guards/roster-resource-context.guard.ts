import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/** `GET /ministry/groups/:groupId/roster` and
 * `GET /ministry/groups/:groupId/roster/overcommitment` (FR-MIN-01/04) -
 * both resolve identically, differing only in `@RequirePermission`
 * action. */
@Injectable()
export class RosterResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.params as Record<string, string>).groupId;
    return this.groupScopeService.loadResourceContext(groupId);
  }
}
