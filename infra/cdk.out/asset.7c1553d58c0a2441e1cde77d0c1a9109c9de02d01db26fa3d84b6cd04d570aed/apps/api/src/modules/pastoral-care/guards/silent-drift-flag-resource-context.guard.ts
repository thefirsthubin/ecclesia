import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/**
 * `GET /pastoral-care/groups/:groupId/silent-drift-flags` (Shepherd
 * Dashboard sprint's Priority-card drift flags, FR-PC-05/§15.8).
 * Group-scoped, identical shape to
 * `FollowUpTaskListResourceContextGuard`/`GroupDashboardResourceContextGuard`
 * - resolves `ResourceContext` straight from the `:groupId` route param
 * via People's exported `GroupScopeService`.
 */
@Injectable()
export class SilentDriftFlagListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.params as Record<string, string>).groupId;
    return this.groupScopeService.loadResourceContext(groupId);
  }
}
