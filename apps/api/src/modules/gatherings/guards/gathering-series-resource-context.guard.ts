import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { GatheringSeriesRepository } from '../repositories/gathering-series.repository';

/** `POST /v1/gathering-series` - same resolution as
 * `GatheringCreateResourceContextGuard`, keyed off `groupId` instead of
 * `ownerGroupId` (`GatheringSeries`'s own field name). */
@Injectable()
export class GatheringSeriesCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.body as Record<string, unknown> | undefined)?.groupId as string | undefined;
    if (groupId) {
      return this.groupScopeService.loadResourceContext(groupId);
    }
    return { branchId: actor.branchId };
  }
}

/** `GET /v1/gathering-series/:id`. */
@Injectable()
export class GatheringSeriesResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly gatheringSeriesRepository: GatheringSeriesRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const series = await this.gatheringSeriesRepository.findById(id);
    if (!series) {
      throw new NotFoundException(`No Gathering series found with id '${id}'`);
    }
    if (series.groupId) {
      return this.groupScopeService.loadResourceContext(series.groupId);
    }
    return { branchId: series.branchId };
  }
}
