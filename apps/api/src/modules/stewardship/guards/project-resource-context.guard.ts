import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { ProjectRepository } from '../repositories/project.repository';

/** `POST /v1/projects` (FR-STW-08/H2) - a Branch-level structural entity,
 * not owned by any single Group; resource is simply the actor's own
 * Branch. */
@Injectable()
export class ProjectCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService, prisma: PrismaService) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}

/** `GET /v1/projects/:id`. */
@Injectable()
export class ProjectResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly projectRepository: ProjectRepository,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`No Project found with id '${id}'`);
    }
    return { branchId: project.branchId };
  }
}
