import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/** `[Milestone B: People + Pastoral + Outreach Foundation, Slice 7]`
 * `GET /pastoral-care/calendar` is always Branch-wide - see
 * `PastoralCalendarService`'s own doc comment for why there is no
 * Cluster-narrowing case here, matching
 * `FollowUpTaskListForActorResourceContextGuard`'s own existing
 * no-groupId shape. */
@Injectable()
export class PastoralCalendarResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
