import { Injectable } from '@nestjs/common';
import type { ActorContext, ResourceContext } from '@ecclesia/rbac';

import { BranchConfigurationService } from '../../../platform/rbac/branch-configuration.service';
import { EcclesiaContextGuardBase } from '../../../platform/rbac/ecclesia-context.guard-base';
import type { RequestWithActorContext } from '../../../platform/auth/auth.guard';
import { GroupScopeService } from '../../people/services/group-scope.service';

/**
 * `POST /v1/bank-deposit-confirmations` (FR-STW-07). A bank deposit
 * confirmation is always tied to a Bacenta (`groupId` in the request
 * body, required - unlike `FinancialTransactionCreateResourceContextGuard`,
 * there is no "individual Mobile Money entry" case here), resolved via
 * People's exported `GroupScopeService` - the same cross-module pattern
 * `FinancialTransactionCreateResourceContextGuard` already established.
 */
@Injectable()
export class BankDepositConfirmationCreateResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(
    branchConfigurationService: BranchConfigurationService,
    private readonly groupScopeService: GroupScopeService,
  ) {
    super(branchConfigurationService);
  }

  protected async loadResource(request: RequestWithActorContext, _actor: ActorContext): Promise<ResourceContext> {
    const groupId = (request.body as Record<string, unknown> | undefined)?.groupId as string | undefined;
    if (!groupId) {
      // ZodValidationPipe runs after guards in this codebase's pipeline
      // (see FinancialTransactionCreateResourceContextGuard's own
      // precedent for this exact ordering note) - a missing groupId here
      // means the request body will fail schema validation regardless;
      // this guard just needs *a* branchId to resolve against in the
      // meantime, falling back to the actor's own.
      return { branchId: _actor.branchId };
    }
    return this.groupScopeService.loadResourceContext(groupId);
  }
}

/**
 * `GET /v1/bank-deposit-confirmations/reconciliation` (the weekly
 * reconciliation view, FR-STW-07). Always resolves to just the actor's own
 * Branch - the same `BRANCH`-scoped-only shape
 * `FinancialTransactionListResourceContextGuard` already established for
 * the equivalent Branch-wide aggregate view, with the same disclosed
 * limitation: a `BACENTA_LEADER`'s `OWN_GROUP` scope (if it existed here,
 * which it doesn't - see `permission-matrix.ts`) could never satisfy a
 * `BRANCH`-scoped resource.
 */
@Injectable()
export class BankDepositConfirmationListResourceContextGuard extends EcclesiaContextGuardBase {
  constructor(branchConfigurationService: BranchConfigurationService) {
    super(branchConfigurationService);
  }

  protected async loadResource(_request: RequestWithActorContext, actor: ActorContext): Promise<ResourceContext> {
    return { branchId: actor.branchId };
  }
}
