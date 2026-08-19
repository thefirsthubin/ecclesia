import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/** `[Milestone C.1.3: Pastoral Activity Analytics]` `GET
 * /pastoral-care/activity-summary` - identical shape to
 * `PastoralCalendarResourceContextGuard`, gated on the same
 * `pastoral_care.interaction.read` action (Resident Pastor at BRANCH,
 * Assistant Pastor at CLUSTER only - see that guard's own doc comment
 * for why a CLUSTER-scoped actor needs `resource.bacentaId` set from one
 * member of `actor.clusterBacentaIds` to pass the scope check at all; the
 * real per-row narrowing to the actor's entire cluster happens in
 * `PastoralActivitySummaryService`, not here). */
@Injectable()
export class PastoralActivitySummaryResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId, bacentaId: actor.clusterBacentaIds?.[0] };
  }
}
