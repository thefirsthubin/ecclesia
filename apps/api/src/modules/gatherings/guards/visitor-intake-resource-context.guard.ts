import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { GatheringRepository } from '../repositories/gathering.repository';

/**
 * `POST /v1/visitor-intake` (FR-GTH-04). Scope preference order: the
 * Gathering the visitor was captured at (`gatheringId`, if supplied) -
 * matching `AttendanceResourceContextGuard`'s own resolution, since a
 * visitor intake at a specific Gathering is scoped the same way
 * attendance for that Gathering would be - then a supplied
 * `bacentaPreferenceGroupId` (self-service capture with no specific
 * Gathering context), then the actor's own Branch.
 */
@Injectable()
export class VisitorIntakeResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly gatheringRepository: GatheringRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const body = request.body as Record<string, unknown> | undefined;
    const gatheringId = body?.gatheringId as string | undefined;
    if (gatheringId) {
      const gathering = await this.gatheringRepository.findById(gatheringId);
      if (gathering?.ownerGroupId) {
        return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
      }
      if (gathering) {
        return { branchId: gathering.branchId };
      }
      // A nonexistent gatheringId is a validation concern for the
      // service layer, not this guard - falls through to the next
      // preference rather than throwing here, since RbacGuard denying
      // on a bad ID would produce a confusing 403 instead of the
      // service's own clearer 404/400.
    }

    const bacentaPreferenceGroupId = body?.bacentaPreferenceGroupId as string | undefined;
    if (bacentaPreferenceGroupId) {
      return this.groupScopeService.loadResourceContext(bacentaPreferenceGroupId);
    }

    return { branchId: actor.branchId };
  }
}
