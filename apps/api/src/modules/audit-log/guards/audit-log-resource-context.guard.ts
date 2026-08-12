import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/**
 * `[Audit Log milestone]` `GET /platform/audit-log`. Same "trivially the
 * actor's own Branch" shape as `BranchConfigurationResourceContextGuard` -
 * this is a Branch-wide list, not a single-resource lookup, so there is no
 * `:id` to resolve a narrower resource from. `branchId` is never read from
 * the request/query string, only from the server-resolved `ActorContext` -
 * PRD §17.3's Audit Log row grants BRANCH/CLUSTER/OWN_GROUP scopes, never a
 * client-chosen Branch.
 */
@Injectable()
export class AuditLogResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
