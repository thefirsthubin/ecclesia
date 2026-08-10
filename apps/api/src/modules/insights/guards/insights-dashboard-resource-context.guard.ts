import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/**
 * `GET /insights/branch-dashboard` (FR-INS-04, Resident Pastor's
 * whole-Branch view). Always resolves to just the actor's own Branch -
 * the `BRANCH`-scoped rows (`RESIDENT_PASTOR`/`ASSISTANT_PASTOR`/`ADMIN`)
 * are this endpoint's intended consumers, mirroring
 * `FinancialTransactionListResourceContextGuard`'s identical precedent
 * (Stewardship's `GET /financial-transactions`).
 */
@Injectable()
export class BranchDashboardResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}

/**
 * `GET /insights/bacenta-dashboard/:groupId` and
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Shepherd's own
 * Bacenta / Assistant Pastor's cluster drill-down). Both routes share
 * this one guard - they differ only in which `@RequirePermission` action
 * (and therefore which `permission-matrix.ts` scope rows) applies, not in
 * how the target Group's `ResourceContext` is resolved. Reuses People's
 * exported `GroupScopeService` (Blueprint §7.2), the third consumer of
 * that cross-module service after Gatherings and Stewardship.
 *
 * The cluster route is a **single-Bacenta drill-down**, not a true
 * multi-Bacenta ranked list - `evaluate.ts`'s `resourceInScope()` CLUSTER
 * case tests one `resource.bacentaId` against the actor's
 * `clusterBacentaIds` set; there is no `ResourceContext` shape for "many
 * Bacentas at once" under the current single-resource model. See
 * `INSIGHTS_DESIGN_NOTES.md` for the disclosed gap (same category as
 * People's deferred search/directory).
 */
@Injectable()
export class GroupDashboardResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.params as Record<string, string>).groupId;
    return this.groupScopeService.loadResourceContext(groupId);
  }
}
