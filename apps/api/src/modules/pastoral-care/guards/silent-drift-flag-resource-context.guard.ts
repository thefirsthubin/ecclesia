import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
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
 * `[Silent-Drift Detection Branch-wide milestone]` `GET
 * /pastoral-care/silent-drift-flags`. Identical shape to Follow-up Task's
 * own `FollowUpTaskListForActorResourceContextGuard`: a `groupId` query
 * param means an OWN_GROUP/CLUSTER-scoped actor named their own Group
 * (resolved via `GroupScopeService`, same as the path-param guard above);
 * its absence falls back to the actor's own Branch, satisfying
 * `pastoral_care.silent_drift_flag.read`'s BRANCH-scope rows (Resident
 * Pastor, Admin) with no Group to name. `branchId` is never taken from
 * the client - it comes from `actor.branchId`, the server-resolved
 * `ActorContext` `AuthGuard` already populated before this guard runs.
 */
@Injectable()
export class SilentDriftFlagListForActorResourceContextGuard extends EcclesiaContextGuardBase {
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
