import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { OutreachRepository } from '../repositories/outreach.repository';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` `POST /v1/outreach`
 * - mirrors `GatheringCreateResourceContextGuard` exactly: `groupId` in
 * the body present -> resolve via People's exported `GroupScopeService`;
 * absent -> the actor's own Branch.
 */
@Injectable()
export class OutreachCreateResourceContextGuard extends EcclesiaContextGuardBase {
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

/** `GET /v1/outreach` - mirrors `GatheringListResourceContextGuard`/
 * `FollowUpTaskListForActorResourceContextGuard`'s identical shape. */
@Injectable()
export class OutreachListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.query as Record<string, string>).groupId;
    if (groupId) {
      return this.groupScopeService.loadResourceContext(groupId);
    }
    return Promise.resolve({ branchId: actor.branchId });
  }
}

/** `GET /v1/outreach/:id` - loads the existing Outreach, then resolves
 * scope the same way the create guard does when `groupId` is set. */
@Injectable()
export class OutreachResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly outreachRepository: OutreachRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const outreach = await this.outreachRepository.findById(id);
    if (!outreach) {
      throw new NotFoundException(`No Outreach found with id '${id}'`);
    }
    if (outreach.groupId) {
      return this.groupScopeService.loadResourceContext(outreach.groupId);
    }
    return { branchId: outreach.branchId };
  }
}
