import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/** `[Milestone B: People + Pastoral + Outreach Foundation, Slice 7]`
 * `GET /pastoral-care/calendar`.
 *
 * `[Milestone C: Portal Read Models + Analytics, Phase 1 decision #11]`
 * This guard previously always resolved a bare `{ branchId }` - this
 * milestone's own audit found that, read literally against
 * `evaluate.ts`'s CLUSTER case (which requires `resource.bacentaId !==
 * undefined`), that resource shape can never satisfy the CLUSTER scope
 * `ASSISTANT_PASTOR` actually holds for `pastoral_care.interaction.read`,
 * meaning this endpoint denied every Assistant Pastor call rather than
 * leaking Branch-wide data as an earlier design note had assumed. Fixed
 * the same way `FollowUpTaskListForActorResourceContextGuard`/
 * `SilentDriftFlagListForActorResourceContextGuard` were: a CLUSTER-scoped
 * actor now gets `resource.bacentaId` set to one member of
 * `actor.clusterBacentaIds`, satisfying the scope check; the real
 * per-row narrowing to the actor's *entire* cluster happens in
 * `PastoralCalendarService.getCalendar()`, not here - this guard only
 * gates whether the actor may reach the endpoint at all, the same
 * division of responsibility every other resource-context guard in this
 * codebase already follows for list-shaped resources. */
@Injectable()
export class PastoralCalendarResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId, bacentaId: actor.clusterBacentaIds?.[0] };
  }
}
