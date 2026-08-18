import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { OutreachContactRepository } from '../repositories/outreach-contact.repository';
import { OutreachRepository } from '../repositories/outreach.repository';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` `POST/GET
 * /v1/outreach/:outreachId/contacts` - the resource being scoped is the
 * *parent Outreach event's* own scope (its `groupId` if set, else its
 * Branch), the same "the container defines the scope" resolution
 * `PastoralNoteResourceContextGuard` uses via `PersonScopeService` for
 * its own parent (a Person, there).
 */
@Injectable()
export class OutreachContactCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly outreachRepository: OutreachRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const outreachId = (request.params as Record<string, string>).outreachId;
    const outreach = await this.outreachRepository.findById(outreachId);
    if (!outreach) {
      throw new NotFoundException(`No Outreach found with id '${outreachId}'`);
    }
    if (outreach.groupId) {
      return this.groupScopeService.loadResourceContext(outreach.groupId);
    }
    return { branchId: outreach.branchId };
  }
}

/**
 * `POST /v1/outreach/contacts/:id/promote`, `PATCH
 * /v1/outreach/contacts/:id/outcome` - loads the OutreachContact, then
 * its parent Outreach, then resolves scope the same way the guard above
 * does. Two hops (contact -> outreach -> scope) because the contact row
 * itself carries no `groupId` - only its parent event does.
 */
@Injectable()
export class OutreachContactResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly outreachContactRepository: OutreachContactRepository,
    private readonly outreachRepository: OutreachRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const contact = await this.outreachContactRepository.findById(id);
    if (!contact) {
      throw new NotFoundException(`No OutreachContact found with id '${id}'`);
    }
    const outreach = await this.outreachRepository.findById(contact.outreachId);
    if (!outreach) {
      throw new NotFoundException(`No Outreach found with id '${contact.outreachId}'`);
    }
    if (outreach.groupId) {
      return this.groupScopeService.loadResourceContext(outreach.groupId);
    }
    return { branchId: outreach.branchId };
  }
}
