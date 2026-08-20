import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/tenants`. `ResourceContext.branchId` is a required field, but
 * `evaluate.ts`'s `resourceInScope` never inspects it for `GLOBAL` scope
 * (`case 'GLOBAL': return true`) - `SYSTEM_ADMINISTRATOR`'s
 * `platform.tenant.read` grant is `GLOBAL`, so `actor.branchId` here is
 * purely a schema-compliance formality, the same "populated but
 * authorization-irrelevant" role it plays on this actor's own
 * `RoleAssignment` row (`dev-users.ts`'s `roleAssignmentScopeKindFor` doc
 * comment, `'PLATFORM'` case).
 */
@Injectable()
export class TenantListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
