import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/**
 * `[Branch Configuration milestone]` `GET/POST/PATCH /platform/configuration`.
 * A `Configuration` row has no Group/cluster dimension at all - it is a
 * per-Branch singleton (`branchId` unique, `db/schema.prisma`) - so,
 * unlike every other domain's split of Create/List/single-resource
 * guards, one guard covers all three routes here: the resource is
 * trivially "the actor's own Branch," the identical shape
 * `GroupCreateResourceContextGuard`/`GroupListResourceContextGuard`
 * already established for the same "nothing more specific to resolve"
 * case. `branchId` is never read from the request - only from
 * `actor.branchId`, the server-resolved `ActorContext`.
 */
@Injectable()
export class BranchConfigurationResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
