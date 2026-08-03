import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { GatheringRepository } from '../repositories/gathering.repository';

/**
 * `POST /v1/gatherings` - §12.4's implementation note: `ownerGroupId` is
 * mandatory for a Bacenta/Basonta Meeting and null for a Branch-wide
 * Gathering (Sunday Service etc). When the request body names an
 * `ownerGroupId`, this delegates to People's exported `GroupScopeService`
 * to resolve whether it's a Bacenta or Basonta (Blueprint §7.2 - the same
 * cross-module consumption pattern Pastoral Care already established for
 * `PersonScopeService`); otherwise the resource is trivially the actor's
 * own Branch.
 */
@Injectable()
export class GatheringCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const ownerGroupId = (request.body as Record<string, unknown> | undefined)?.ownerGroupId as string | undefined;
    if (ownerGroupId) {
      return this.groupScopeService.loadResourceContext(ownerGroupId);
    }
    return { branchId: actor.branchId };
  }
}

/**
 * `GET/PATCH /v1/gatherings/:id` - loads the existing Gathering, then
 * resolves scope the same way `GatheringCreateResourceContextGuard` does
 * when `ownerGroupId` is set; a Branch-wide Gathering (`ownerGroupId`
 * null) resolves to just its own `branchId`.
 */
@Injectable()
export class GatheringResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly gatheringRepository: GatheringRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const gathering = await this.gatheringRepository.findById(id);
    if (!gathering) {
      throw new NotFoundException(`No Gathering found with id '${id}'`);
    }
    if (gathering.ownerGroupId) {
      return this.groupScopeService.loadResourceContext(gathering.ownerGroupId);
    }
    return { branchId: gathering.branchId };
  }
}

/**
 * `GET /gatherings?ownerGroupId=...` (Shepherd Dashboard sprint's
 * Today's-Meeting/Attendance-Summary cards - [Gap], see
 * `SHEPHERD_DASHBOARD_DESIGN_NOTES.md` STEP 6). Group-scoped via
 * `GroupScopeService` when `ownerGroupId` is supplied, the identical
 * pattern `GatheringCreateResourceContextGuard` already uses for the
 * request body's `ownerGroupId`.
 *
 * `ownerGroupId` is now optional (Gatherings Web Admin sprint) - its
 * absence falls back to the actor's own Branch, the same shape
 * `PersonListResourceContextGuard`/`FollowUpTaskListForActorResourceContextGuard`
 * already established for their own BRANCH-scoped list cases. See
 * `apps/web-admin/.../Gatherings/GATHERINGS_PAGE_DESIGN_NOTES.md`.
 */
@Injectable()
export class GatheringListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const ownerGroupId = (request.query as Record<string, string>).ownerGroupId;
    if (ownerGroupId) {
      return this.groupScopeService.loadResourceContext(ownerGroupId);
    }
    return Promise.resolve({ branchId: actor.branchId });
  }
}
