import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/**
 * `[Milestone C: Portal Read Models + Analytics]` `GET
 * /insights/giving-trend`. Reuses `stewardship.transaction.read` (Phase
 * 10's "reuse the underlying domain permission" instruction) - this
 * guard only decides *whether* the actor may hit the endpoint at all,
 * the same division of responsibility every other list-shaped guard in
 * this codebase already follows (`FollowUpTaskListForActorResourceContextGuard`
 * et al.) - the real per-row scope narrowing (own group / own cluster /
 * one named Council Branch) happens in `GivingTrendService` itself.
 *
 * `?groupId=` drills into one specific Group, validated the normal way
 * (`GroupScopeService`, so a leader cannot name a Group outside their
 * own scope). `?council=true` is trivially satisfied by the actor's own
 * `branchId` (COUNCIL scope tests `actor.councilBranchIds.includes(resource.branchId)`,
 * and an actor's own Branch is always a member of their own Council) -
 * the real Council-wide loop happens in the service, this guard just
 * needs the check to pass once. Otherwise, resolves the actor's own
 * natural scope shape (`bacentaId`/`basontaId` for OWN_GROUP, one member
 * of `clusterBacentaIds` for CLUSTER) - the same `[Milestone C]` fix
 * already applied to `FollowUpTaskListForActorResourceContextGuard`/
 * `PastoralCalendarResourceContextGuard`.
 */
@Injectable()
export class GivingTrendResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const query = request.query as Record<string, string>;
    if (query.groupId) {
      return this.groupScopeService.loadResourceContext(query.groupId);
    }
    return Promise.resolve({
      branchId: actor.branchId,
      bacentaId: actor.bacentaId ?? actor.clusterBacentaIds?.[0],
      basontaId: actor.basontaId,
    });
  }
}
