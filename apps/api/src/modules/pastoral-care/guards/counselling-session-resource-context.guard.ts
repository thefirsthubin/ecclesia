import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../../people/services/person-scope.service';
import { CounsellingSessionRepository } from '../repositories/counselling-session.repository';

/** `[Milestone B: People + Pastoral + Outreach Foundation]` `POST/GET
 * /v1/people/:personId/counselling-sessions` - same "subject Person
 * defines the scope" resolution as `PastoralNoteResourceContextGuard`/
 * `PrayerNoteResourceContextGuard`. */
@Injectable()
export class CounsellingSessionResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const personId = (request.params as Record<string, string>).personId;
    return this.personScopeService.loadResourceContext(personId, actor);
  }
}

/** `PATCH /v1/counselling-sessions/:id/status` - loads the existing
 * session, resolves scope from its own subject Person. */
@Injectable()
export class CounsellingSessionStatusResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly counsellingSessionRepository: CounsellingSessionRepository,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const session = await this.counsellingSessionRepository.findById(id);
    if (!session) {
      throw new NotFoundException(`No CounsellingSession found with id '${id}'`);
    }
    return this.personScopeService.loadResourceContext(session.personId, actor);
  }
}
