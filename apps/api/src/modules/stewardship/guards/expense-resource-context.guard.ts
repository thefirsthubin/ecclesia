import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { PersonScopeService } from '../../people/services/person-scope.service';
import { ExpenseRepository } from '../repositories/expense.repository';

/**
 * `POST /v1/expenses` (FR-STW-09). `db/schema.prisma`'s `Expense` has no
 * `groupId` field of its own (only `requestedByPersonId`) - scope is
 * resolved from the *requester's own* Person scope via People's exported
 * `PersonScopeService`, the same cross-module pattern already established
 * for Gatherings/Pastoral Care, applied here to the *acting* Person
 * (`actor.personId`) rather than some other resource's subject Person.
 */
@Injectable()
export class ExpenseCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return this.personScopeService.loadResourceContext(actor.personId, actor);
  }
}

/**
 * `GET/POST /v1/expenses/:id/...` (approve/reject/pay/receipt/read).
 * Resolves scope from the Expense's own `requestedByPersonId` via
 * `PersonScopeService`, and always additionally sets
 * `resource.recordedByPersonId` to that same `requestedByPersonId` -
 * FR-STW-09's "approver must not be the requester" reuses
 * `DIFFERENT_ACTOR_THAN_RECORDER` (see `permission-matrix.ts`'s
 * `stewardship.expense.approve` rows), which reads that exact field
 * regardless of whether the underlying resource is a Financial
 * Transaction or, as here, an Expense.
 */
@Injectable()
export class ExpenseResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly expenseRepository: ExpenseRepository,
    private readonly personScopeService: PersonScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    const id = (request.params as Record<string, string>).id;
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundException(`No Expense found with id '${id}'`);
    }

    const personScope = await this.personScopeService.loadResourceContext(expense.requestedByPersonId, actor);
    return { ...personScope, recordedByPersonId: expense.requestedByPersonId };
  }
}

/**
 * `GET /v1/expenses` (Stewardship Web Admin sprint's Expense approval
 * queue). Always resolves to just the actor's own Branch, the identical
 * shape `FinancialTransactionListResourceContextGuard` already
 * established for `GET /v1/financial-transactions` - the `BRANCH`-scoped
 * rows (`RESIDENT_PASTOR`/`TREASURER`) are this endpoint's intended
 * consumers; `ASSISTANT_PASTOR`'s own `CLUSTER`-scoped `.read` grant
 * cannot be satisfied by a Branch-wide list resource, the same disclosed
 * limitation the Financial Transaction list guard already carries.
 */
@Injectable()
export class ExpenseListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
