import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { StaffingTargetRepository } from '../repositories/staffing-target.repository';

/** `POST /ministry/staffing-targets` (FR-MIN-02) - resolves scope from
 * the target Basonta named in the request body, reusing People's
 * exported `GroupScopeService` exactly as Stewardship/Insights already
 * do. */
@Injectable()
export class StaffingTargetCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.body as Record<string, unknown> | undefined)?.groupId as string | undefined;
    if (!groupId) {
      throw new NotFoundException("Request body must include a 'groupId'");
    }
    return this.groupScopeService.loadResourceContext(groupId);
  }
}

/** `GET /ministry/staffing-targets/:id`. */
@Injectable()
export class StaffingTargetResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly staffingTargetRepository: StaffingTargetRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const target = await this.staffingTargetRepository.findById(id);
    if (!target) {
      throw new NotFoundException(`No Staffing Target found with id '${id}'`);
    }
    return this.groupScopeService.loadResourceContext(target.groupId);
  }
}
