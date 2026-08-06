import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RecordLevelPolicyGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { flagFinancialTransactionSchema, recordFinancialTransactionSchema } from '@ecclesia/contracts';
import type { FlagFinancialTransactionInput, RecordFinancialTransactionInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  FinancialTransactionCreateResourceContextGuard,
  FinancialTransactionListResourceContextGuard,
  FinancialTransactionResourceContextGuard,
} from '../guards/financial-transaction-resource-context.guard';
import { FinancialTransactionService } from '../services/financial-transaction.service';

/**
 * PRD §17.3's "Financial Transaction: record/verify/reconcile" rows,
 * FR-STW-01 through FR-STW-05/FR-STW-07. `verify`/`flag`/`escalate` all
 * declare `stewardship.transaction.verify` - PRD §17.3 has one "verify"
 * row covering the Treasurer's whole verification-time decision
 * (confirm/flag a discrepancy/escalate an unresolved one), not three
 * separate matrix rows. `verify` is this module's - and this codebase's -
 * first real declarative use of `RecordLevelPolicyGuard` (Blueprint §9.4's
 * own worked example): every prior `recordLevelCheck` user
 * (`POIMEN_GATE_IF_ENABLED`) went through `RoleAssignmentService`'s
 * imperative `evaluate()` escape hatch instead, for reasons specific to
 * that endpoint's data-dependent action selection - see that service's
 * own doc comment. This endpoint has no such complication, so it uses the
 * declarative pipeline exactly as documented.
 */
@Controller('financial-transactions')
export class FinancialTransactionController {
  constructor(private readonly financialTransactionService: FinancialTransactionService) {}

  @Post()
  @RequirePermission('stewardship.transaction.record')
  @UseGuards(FinancialTransactionCreateResourceContextGuard, RbacGuard)
  record(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(recordFinancialTransactionSchema)) body: RecordFinancialTransactionInput,
  ) {
    return this.financialTransactionService.record(actor, body);
  }

  @Get()
  @RequirePermission('stewardship.transaction.read')
  @UseGuards(FinancialTransactionListResourceContextGuard, RbacGuard)
  listByBranch(@CurrentActor() actor: ActorContext, @Query('state') state?: string) {
    return this.financialTransactionService.listByBranch(actor, state);
  }

  @Get(':id')
  @RequirePermission('stewardship.transaction.read')
  @UseGuards(FinancialTransactionResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.financialTransactionService.getById(id);
  }

  @Post(':id/verify')
  @RequirePermission('stewardship.transaction.verify')
  @UseGuards(FinancialTransactionResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  verify(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.financialTransactionService.verify(actor, id);
  }

  @Post(':id/flag')
  @RequirePermission('stewardship.transaction.verify')
  @UseGuards(FinancialTransactionResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  flag(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(flagFinancialTransactionSchema)) body: FlagFinancialTransactionInput,
  ) {
    return this.financialTransactionService.flag(actor, id, body);
  }

  @Post(':id/escalate')
  @RequirePermission('stewardship.transaction.verify')
  @UseGuards(FinancialTransactionResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  escalate(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.financialTransactionService.escalate(actor, id);
  }

  @Post(':id/reconcile')
  @RequirePermission('stewardship.transaction.reconcile')
  @UseGuards(FinancialTransactionResourceContextGuard, RbacGuard)
  reconcile(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.financialTransactionService.reconcile(actor, id);
  }
}
