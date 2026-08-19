import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PotentialRepository } from '../repositories/potential.repository';
import { GroupScopeService } from '../services/group-scope.service';

/**
 * `[Milestone C.1.1: Complete Read Models]` `POST /potentials` - `groupId`
 * in the body present -> resolve via `GroupScopeService` (validates it
 * against the actor's own scope, mirroring
 * `OutreachCreateResourceContextGuard`); absent -> the actor's own scope
 * shape directly (`bacentaId`/`basontaId`/one member of
 * `clusterBacentaIds`), the same `[Milestone C]` fix already applied to
 * every other "list/create for actor, no explicit group" guard in this
 * codebase - without it, an OWN_GROUP/CLUSTER-scoped actor creating
 * without naming their own `groupId` would be denied outright rather
 * than falling through to a sensible default.
 */
@Injectable()
export class PotentialCreateResourceContextGuard extends EcclesiaContextGuardBase {
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
    return {
      branchId: actor.branchId,
      bacentaId: actor.bacentaId ?? actor.clusterBacentaIds?.[0],
      basontaId: actor.basontaId,
    };
  }
}

/** `GET /potentials` - same shape as the create guard above. */
@Injectable()
export class PotentialListResourceContextGuard extends EcclesiaContextGuardBase {
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
    return Promise.resolve({
      branchId: actor.branchId,
      bacentaId: actor.bacentaId ?? actor.clusterBacentaIds?.[0],
      basontaId: actor.basontaId,
    });
  }
}

/** `GET/PATCH /potentials/:id` - loads the existing Potential, then
 * resolves scope from its own `groupId` when set (mirroring
 * `OutreachResourceContextGuard`'s identical precedent); a `groupId`-less
 * Potential falls back to its own Branch, reachable only by a
 * COUNCIL/BRANCH-scoped read - a disclosed, not silently-worked-around,
 * consequence of `groupId` being optional (Phase 1 decision #4's own
 * "Branch-wide referral may have no single owning Group yet" case). */
@Injectable()
export class PotentialResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly potentialRepository: PotentialRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const potential = await this.potentialRepository.findById(id);
    if (!potential) {
      throw new NotFoundException(`No Potential found with id '${id}'`);
    }
    if (potential.groupId) {
      return this.groupScopeService.loadResourceContext(potential.groupId);
    }
    return { branchId: potential.branchId };
  }
}
