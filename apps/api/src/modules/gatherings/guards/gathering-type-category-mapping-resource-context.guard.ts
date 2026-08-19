import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';

/**
 * `[Milestone C: Portal Read Models + Analytics]` `GET/POST
 * /gatherings/type-category-mappings` - a per-Branch resource (no `:id`
 * route param, mirroring `BranchConfigurationResourceContextGuard`'s own
 * shape for the closely-related `platform.configuration.*` actions this
 * controller reuses), always resolved to the actor's own Branch.
 */
@Injectable()
export class GatheringTypeCategoryMappingResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
