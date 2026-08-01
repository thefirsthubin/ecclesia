import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';
import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';

/**
 * `POST /v1/financial-transactions` (FR-STW-01). §12.7's edge case:
 * `sourceGroupId` present means a Bacenta-collected offering (resolved via
 * People's exported `GroupScopeService`, the same cross-module pattern
 * Gatherings already established for `ownerGroupId`/`groupId`); absent
 * means an individual Mobile Money entry, whose resource is the *acting*
 * Person themselves (`ownerId: actor.personId`, matching
 * `evaluate.ts`'s `SELF` scope check) - never a client-supplied
 * `giverPersonId`, per `recordFinancialTransactionSchema`'s own doc
 * comment.
 */
@Injectable()
export class FinancialTransactionCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const sourceGroupId = (request.body as Record<string, unknown> | undefined)?.sourceGroupId as string | undefined;
    if (sourceGroupId) {
      return this.groupScopeService.loadResourceContext(sourceGroupId);
    }
    return { branchId: actor.branchId, ownerId: actor.personId };
  }
}

/**
 * `GET/POST /v1/financial-transactions/:id/...` (verify/flag/escalate/
 * reconcile/read). Loads the existing transaction, resolves scope the same
 * way the create guard does when `sourceGroupId` is set, and always
 * additionally populates `recordedByPersonId`
 * (`FinancialTransactionRepository.findRecordedByPersonId`) - PRD §17.4/
 * BR-STW-04's `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs it
 * on the `verify` route; populating it unconditionally on every route this
 * guard covers is simpler than branching per-action, and harmless for
 * routes whose matched rule names no `recordLevelCheck` at all
 * (`evaluateRecordLevelCheck` only consults it when a rule actually names
 * one).
 */
@Injectable()
export class FinancialTransactionResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly financialTransactionRepository: FinancialTransactionRepository,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const transaction = await this.financialTransactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`No Financial Transaction found with id '${id}'`);
    }

    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);

    if (transaction.sourceGroupId) {
      const groupScope = await this.groupScopeService.loadResourceContext(transaction.sourceGroupId);
      return { ...groupScope, recordedByPersonId };
    }
    return {
      branchId: transaction.branchId,
      ownerId: transaction.giverPersonId ?? undefined,
      recordedByPersonId,
    };
  }
}

/**
 * `GET /v1/financial-transactions` (the verification/discrepancy queue,
 * FR-STW-03/04). Always resolves to just the actor's own Branch - the
 * `BRANCH`-scoped rows (`RESIDENT_PASTOR`/`ASSISTANT_PASTOR`/`TREASURER`)
 * are this endpoint's intended consumers. A `BACENTA_LEADER`'s own
 * `OWN_GROUP`-scoped `.read` grant cannot be satisfied by a Branch-wide
 * list resource - they use `GET /v1/financial-transactions/:id` for
 * individual records instead. See `STEWARDSHIP_DESIGN_NOTES.md`.
 */
@Injectable()
export class FinancialTransactionListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
