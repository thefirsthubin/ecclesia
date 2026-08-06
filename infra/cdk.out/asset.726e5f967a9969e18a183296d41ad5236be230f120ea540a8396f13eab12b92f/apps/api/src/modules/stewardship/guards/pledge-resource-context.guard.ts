import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PledgeRepository } from '../repositories/pledge.repository';

/** `POST /v1/pledges` (FR-STW-08/H2) - always the acting Member's own
 * commitment (`SELF` scope) - see `PledgeService`'s doc comment. */
@Injectable()
export class PledgeCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId, ownerId: actor.personId };
  }
}

/** `GET/POST /v1/pledges/:id/...` (read/fulfill). */
@Injectable()
export class PledgeResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly pledgeRepository: PledgeRepository,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const pledge = await this.pledgeRepository.findById(id);
    if (!pledge) {
      throw new NotFoundException(`No Pledge found with id '${id}'`);
    }
    return { branchId: pledge.branchId, ownerId: pledge.personId };
  }
}
