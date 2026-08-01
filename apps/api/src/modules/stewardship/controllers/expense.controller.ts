import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RbacGuard, RecordLevelPolicyGuard, RequirePermission } from '@ecclesia/rbac';
import type { ActorContext } from '@ecclesia/rbac';
import { attachExpenseReceiptSchema, rejectExpenseSchema, requestExpenseSchema } from '@ecclesia/contracts';
import type { AttachExpenseReceiptInput, RejectExpenseInput, RequestExpenseInput } from '@ecclesia/contracts';

import { CurrentActor } from '../../../platform/auth/decorators/current-actor.decorator';
import { ZodValidationPipe } from '../../../platform/pipes/zod-validation.pipe';
import { ExpenseCreateResourceContextGuard, ExpenseResourceContextGuard } from '../guards/expense-resource-context.guard';
import { ExpenseService } from '../services/expense.service';

/** PRD §17.3's "Expense: request/approve" rows, FR-STW-09, BR-STW-07/08. */
@Controller('expenses')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RequirePermission('stewardship.expense.request')
  @UseGuards(ExpenseCreateResourceContextGuard, RbacGuard)
  request(@CurrentActor() actor: ActorContext, @Body(new ZodValidationPipe(requestExpenseSchema)) body: RequestExpenseInput) {
    return this.expenseService.request(actor, body);
  }

  @Get(':id')
  @RequirePermission('stewardship.expense.read')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  getById(@Param('id') id: string) {
    return this.expenseService.getById(id);
  }

  /** FR-STW-09: approver must not be the requester -
   * `DIFFERENT_ACTOR_THAN_RECORDER`, reused (see `ExpenseResourceContextGuard`'s
   * doc comment); the first consumer of `RecordLevelPolicyGuard` outside
   * the Financial Transaction sub-flow. */
  @Post(':id/approve')
  @RequirePermission('stewardship.expense.approve')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  approve(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.expenseService.approve(actor, id);
  }

  @Post(':id/reject')
  @RequirePermission('stewardship.expense.approve')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard, RecordLevelPolicyGuard)
  reject(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(rejectExpenseSchema)) body: RejectExpenseInput,
  ) {
    return this.expenseService.reject(actor, id, body);
  }

  @Post(':id/pay')
  @RequirePermission('stewardship.expense.pay')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  pay(@CurrentActor() actor: ActorContext, @Param('id') id: string) {
    return this.expenseService.pay(actor, id);
  }

  @Post(':id/receipt')
  @RequirePermission('stewardship.expense.receipt')
  @UseGuards(ExpenseResourceContextGuard, RbacGuard)
  attachReceipt(
    @CurrentActor() actor: ActorContext,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(attachExpenseReceiptSchema)) body: AttachExpenseReceiptInput,
  ) {
    return this.expenseService.attachReceipt(actor, id, body);
  }
}
