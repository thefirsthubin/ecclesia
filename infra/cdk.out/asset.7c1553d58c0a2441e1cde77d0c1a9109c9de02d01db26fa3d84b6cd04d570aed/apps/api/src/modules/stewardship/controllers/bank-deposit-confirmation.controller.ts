import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { RbacGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { confirmBankDepositSchema } from '@ecclesia/contracts';
import type { ConfirmBankDepositInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import {
  BankDepositConfirmationCreateResourceContextGuard,
  BankDepositConfirmationListResourceContextGuard,
} from '../guards/bank-deposit-confirmation-resource-context.guard';
import { BankDepositConfirmationService } from '../services/bank-deposit-confirmation.service';

/**
 * FR-STW-07's bank-deposit comparison half. `GET /reconciliation` is
 * declared with no `:id` route on this controller to conflict with, so
 * ordering relative to a future `GET /:id` (not built - see
 * `STEWARDSHIP_DESIGN_NOTES.md`) is not a concern the way it is on
 * `FinancialTransactionController`.
 */
@Controller('bank-deposit-confirmations')
export class BankDepositConfirmationController {
  constructor(private readonly bankDepositConfirmationService: BankDepositConfirmationService) {}

  @Post()
  @RequirePermission('stewardship.bank_deposit.confirm')
  @UseGuards(BankDepositConfirmationCreateResourceContextGuard, RbacGuard)
  confirm(
    @CurrentActor() actor: ActorContext,
    @Body(new ZodValidationPipe(confirmBankDepositSchema)) body: ConfirmBankDepositInput,
  ) {
    return this.bankDepositConfirmationService.confirm(actor, body);
  }

  @Get('reconciliation')
  @RequirePermission('stewardship.bank_deposit.read')
  @UseGuards(BankDepositConfirmationListResourceContextGuard, RbacGuard)
  getWeeklyReconciliation(@CurrentActor() actor: ActorContext, @Query('weekStartDate') weekStartDate: string) {
    return this.bankDepositConfirmationService.getWeeklyReconciliation(actor, weekStartDate);
  }
}
