import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { PrismaService } from '../../../platform/database/prisma.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../../people/services/person-scope.service';
import { PrayerNoteRepository } from '../repositories/prayer-note.repository';

/**
 * `[Milestone B: People + Pastoral + Outreach Foundation]` `POST/GET
 * /v1/people/:personId/prayer-notes` - same "subject Person defines the
 * scope" resolution as `PastoralNoteResourceContextGuard`, via
 * `PersonScopeService`. This guard only establishes organizational scope
 * (Branch/Cluster) - the additional author-only narrowing happens inside
 * `PrayerNoteService.listByPerson` itself, not here (a guard resolves
 * "can this actor reach this endpoint at all," not "which specific rows
 * they'll see" - the same division `FinancialTransactionListResourceContextGuard`
 * vs. `FinancialTransactionService.listByBranch`'s own `sourceGroupId`
 * narrowing already established).
 */
@Injectable()
export class PrayerNoteResourceContextGuard extends EcclesiaContextGuardBase {
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

/** `PATCH /v1/prayer-notes/:id/status` - loads the existing PrayerNote,
 * then resolves scope from its own subject Person the same way the
 * guard above does. `PrayerNoteService.updateStatus` separately enforces
 * the stronger author-only check (this guard only re-confirms
 * organizational scope reachability, matching every other single-record
 * guard's division of responsibility in this codebase). */
@Injectable()
export class PrayerNoteStatusResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    prisma: PrismaService,
    private readonly prayerNoteRepository: PrayerNoteRepository,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService, prisma);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const note = await this.prayerNoteRepository.findById(id);
    if (!note) {
      throw new NotFoundException(`No PrayerNote found with id '${id}'`);
    }
    return this.personScopeService.loadResourceContext(note.personId, actor);
  }
}
