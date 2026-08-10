import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { GatheringRepository } from '../repositories/gathering.repository';

/**
 * `POST/GET /v1/gatherings/:gatheringId/attendance-records` (FR-GTH-03).
 * Attendance is scoped by the Gathering it belongs to - same resolution
 * as `GatheringResourceContextGuard`, keyed off the `:gatheringId` route
 * param instead of `:id`.
 */
@Injectable()
export class AttendanceResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly gatheringRepository: GatheringRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const gatheringId = (request.params as Record<string, string>).gatheringId;
    const gathering = await this.gatheringRepository.findById(gatheringId);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${gatheringId}'`);
    }
    if (gathering.ownerGroupId) {
      return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
    }
    return { branchId: gathering.branchId };
  }
}
