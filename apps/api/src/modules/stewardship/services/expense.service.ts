import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { checkOutboundTransactionTransition, isOutboundTransactionState } from '@ecclesia/domain-stewardship';
import type { OutboundTransactionState } from '@ecclesia/domain-stewardship';
import type { AttachExpenseReceiptInput, ExpenseResponseDto, RejectExpenseInput, RequestExpenseInput } from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { Expense, FinancialTransaction } from '@prisma/client';

import { ExpenseRepository } from '../repositories/expense.repository';
import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';

function toResponseDto(expense: Expense, transaction: FinancialTransaction): ExpenseResponseDto {
  return {
    id: expense.id,
    branchId: expense.branchId,
    transactionId: expense.transactionId,
    requestedByPersonId: expense.requestedByPersonId,
    description: expense.description,
    category: expense.category,
    receiptStorageKey: expense.receiptStorageKey,
    approvedByPersonId: expense.approvedByPersonId,
    approvedAt: expense.approvedAt ? expense.approvedAt.toISOString() : null,
    amountMinor: transaction.amountMinor.toString(),
    currency: transaction.currency,
    currentState: transaction.currentState,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}

/**
 * FR-STW-09/BR-STW-07/BR-STW-08: the outbound/Expense sub-flow (request/
 * approve/reject/pay/receipt). Modeled as a 1:1 extension of
 * `FinancialTransaction` (`type=EXPENSE`) per `db/DESIGN_NOTES.md` Open
 * Question #5 - this service therefore orchestrates *two* repositories:
 * `FinancialTransactionRepository` for the shared state-machine/event-log
 * half (the same one `FinancialTransactionService` uses for the inbound
 * sub-flow), and `ExpenseRepository` for the extension table's own fields
 * (`description`, `receiptStorageKey`, `approvedByPersonId`, ...).
 *
 * FR-STW-09's "approver != requester" is enforced at the guard/RBAC layer
 * (`DIFFERENT_ACTOR_THAN_RECORDER`, reused - see `permission-matrix.ts`'s
 * `stewardship.expense.approve` rows) exactly like BR-STW-04's
 * verifier != recorder rule, not re-checked here.
 */
@Injectable()
export class ExpenseService {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly financialTransactionRepository: FinancialTransactionRepository,
  ) {}

  async request(actor: ActorContext, input: RequestExpenseInput): Promise<ExpenseResponseDto> {
    const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
    if (!actorUserId) {
      throw new ConflictException(
        `No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`,
      );
    }

    const transaction = await this.financialTransactionRepository.createWithEvent({
      branchId: actor.branchId,
      type: 'EXPENSE',
      amountMinor: BigInt(input.amountMinor),
      currency: input.currency ?? 'GHS',
      initialState: 'REQUESTED',
      actorUserId,
    });
    const expense = await this.expenseRepository.create({
      branchId: actor.branchId,
      transactionId: transaction.id,
      requestedByPersonId: actor.personId,
      description: input.description,
      category: input.category,
    });
    return toResponseDto(expense, transaction);
  }

  async getById(id: string): Promise<ExpenseResponseDto> {
    const { expense, transaction } = await this.requireExpenseWithTransaction(id);
    return toResponseDto(expense, transaction);
  }

  /** FR-STW-09: `REQUESTED -> APPROVED`, stamping `approvedByPersonId`/
   * `approvedAt` on the Expense extension row alongside the shared event
   * log entry. */
  async approve(actor: ActorContext, id: string): Promise<ExpenseResponseDto> {
    const { expense, transaction } = await this.transitionTo(actor, id, 'APPROVED');
    const updated = await this.expenseRepository.update(expense.id, {
      approvedByPersonId: actor.personId,
      approvedAt: new Date(),
    });
    return toResponseDto(updated, transaction);
  }

  /** FR-STW-09: `REQUESTED -> REJECTED` (terminal) with a reason,
   * mirroring `FinancialTransactionService.flag`'s own shape. */
  async reject(actor: ActorContext, id: string, input: RejectExpenseInput): Promise<ExpenseResponseDto> {
    const { expense, transaction } = await this.transitionTo(actor, id, 'REJECTED', input.reason);
    return toResponseDto(expense, transaction);
  }

  /** [INFERRED] `stewardship.expense.pay`, Treasurer-only - see
   * `actions.ts`'s doc comment. `APPROVED -> PAID`. */
  async pay(actor: ActorContext, id: string): Promise<ExpenseResponseDto> {
    const { expense, transaction } = await this.transitionTo(actor, id, 'PAID');
    return toResponseDto(expense, transaction);
  }

  /**
   * BR-STW-08: "receipts are retained for all expenses." `PAID ->
   * RECEIPT_RETAINED` (terminal). [INFERRED] restricted to the Expense's
   * own `requestedByPersonId` at the service layer (not a new
   * record-level check registered in the matrix - see `actions.ts`'s doc
   * comment on `stewardship.expense.receipt` for why): the original
   * requester is the one who made the purchase and holds the physical
   * receipt.
   */
  async attachReceipt(actor: ActorContext, id: string, input: AttachExpenseReceiptInput): Promise<ExpenseResponseDto> {
    const { expense } = await this.requireExpenseWithTransaction(id);
    if (expense.requestedByPersonId !== actor.personId) {
      throw new ForbiddenException(
        `FR-STW-09: only the original requester (Person '${expense.requestedByPersonId}') may attach this Expense's receipt`,
      );
    }
    const { transaction } = await this.transitionTo(actor, id, 'RECEIPT_RETAINED');
    const updated = await this.expenseRepository.update(expense.id, { receiptStorageKey: input.receiptStorageKey });
    return toResponseDto(updated, transaction);
  }

  private async requireExpenseWithTransaction(id: string): Promise<{ expense: Expense; transaction: FinancialTransaction }> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new NotFoundException(`No Expense found with id '${id}'`);
    }
    const transaction = await this.financialTransactionRepository.findById(expense.transactionId);
    if (!transaction) {
      throw new NotFoundException(`No Financial Transaction found for Expense '${id}' (transactionId '${expense.transactionId}')`);
    }
    return { expense, transaction };
  }

  private async transitionTo(
    actor: ActorContext,
    id: string,
    to: OutboundTransactionState,
    reason?: string,
  ): Promise<{ expense: Expense; transaction: FinancialTransaction }> {
    const { expense, transaction } = await this.requireExpenseWithTransaction(id);
    if (!isOutboundTransactionState(transaction.currentState)) {
      throw new ConflictException(
        `Expense '${id}' transaction is in state '${transaction.currentState}', which is not a recognized outbound state`,
      );
    }
    const check = checkOutboundTransactionTransition(transaction.currentState, to);
    if (!check.allowed) {
      throw new ConflictException(check.reason);
    }

    const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
    if (!actorUserId) {
      throw new ConflictException(
        `No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`,
      );
    }

    const updatedTransaction = await this.financialTransactionRepository.appendEvent(
      transaction.id,
      transaction.currentState,
      to,
      actorUserId,
      reason,
    );
    return { expense, transaction: updatedTransaction };
  }
}
