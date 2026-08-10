import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
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
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.body as Record<string, unknown> | undefined)?.groupId as string | undefined;
    if (!groupId) {
      throw new NotFoundException("Request body must include a 'groupId'");
    }
    return this.groupScopeService.loadResourceContext(groupId);
  }
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` `GET
 * /ministry/staffing-targets?groupId=` - the new Staffing Overview list.
 * Resolves scope from the query param the same way
 * `StaffingTargetCreateResourceContextGuard` resolves it from the request
 * body - both ultimately just need "which Basonta is this about," and
 * `GroupScopeService.loadResourceContext` doesn't care where the id came
 * from.
 */
@Injectable()
export class StaffingTargetListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.query as Record<string, unknown> | undefined)?.groupId as string | undefined;
    if (!groupId) {
      throw new NotFoundException("Query must include a 'groupId'");
    }
    return this.groupScopeService.loadResourceContext(groupId);
  }
}

/** `GET /ministry/staffing-targets/:id`. */
@Injectable()
export class StaffingTargetResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly staffingTargetRepository: StaffingTargetRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
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
