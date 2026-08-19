import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/** `[Milestone C: Portal Read Models + Analytics]` `GET
 * /insights/attendance-trend` - reuses `gatherings.attendance.read`.
 * Identical shape to `GivingTrendResourceContextGuard` - see that
 * class's own doc comment for the full reasoning. */
@Injectable()
export class AttendanceTrendResourceContextGuard extends EcclesiaContextGuardBase {
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
