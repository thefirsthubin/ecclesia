import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/branches`. Same "trivially the actor's own Branch" shape as
 * `AuditLogResourceContextGuard` - this is a Council-wide list, not a
 * single-resource lookup, so there is no `:id` to resolve a narrower
 * resource from. The actor's own Branch is always a member of their own
 * `councilBranchIds` (`evaluate.ts`'s COUNCIL-scope check), so this
 * trivially satisfies `RbacGuard`; the real Council-wide enumeration
 * happens in `BranchReadService`, not here - same division of
 * responsibility `GivingTrendResourceContextGuard`'s own doc comment
 * establishes for `council=true` requests.
 */
@Injectable()
export class BranchListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
