import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkInboundTransactionTransition, isInboundTransactionState } from '@ecclesia/domain-stewardship';
import type { InboundTransactionState } from '@ecclesia/domain-stewardship';
import type {
  FinancialTransactionResponseDto,
  FlagFinancialTransactionInput,
  RecordFinancialTransactionInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { FinancialTransaction } from '@prisma/client';

import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';

function toResponseDto(transaction: FinancialTransaction, recordedByPersonId: string | null): FinancialTransactionResponseDto {
  return {
    id: transaction.id,
    branchId: transaction.branchId,
    type: transaction.type,
    sourceGroupId: transaction.sourceGroupId,
    giverPersonId: transaction.giverPersonId,
    channel: transaction.channel,
    amountMinor: transaction.amountMinor.toString(),
    currency: transaction.currency,
    currentState: transaction.currentState,
    recordedByPersonId,
    createdAt: transaction.createdAt.toISOString(),
  };
}

/**
 * FR-STW-01 through FR-STW-05/FR-STW-07, BR-STW-01 through BR-STW-04: the
 * inbound Financial Transaction sub-flow (record/verify/flag/escalate/
 * reconcile). Authorization (who may call `verify`, and BR-STW-04's
 * same-actor check) is decided by `FinancialTransactionResourceContextGuard`
 * + `RbacGuard` + `RecordLevelPolicyGuard` at the HTTP layer (see
 * `stewardship.module.ts`) - this service only enforces PRD §12.7's own
 * state-machine validity, the same division of responsibility
 * `PersonService`/`GatheringService` already established for their own
 * domains.
 */
@Injectable()
export class FinancialTransactionService {
  constructor(private readonly financialTransactionRepository: FinancialTransactionRepository) {}

  /**
   * FR-STW-01/BR-STW-01/BR-STW-02: `sourceGroupId` present means a
   * Bacenta-collected offering (`giverPersonId` left unset - the giver is
   * the Bacenta as a collection point, not one individual); absent means
   * an individual Mobile Money entry, whose `giverPersonId` is always the
   * *acting* Person - see `recordFinancialTransactionSchema`'s doc comment
   * in `libs/contracts` for why this is never taken from client input.
   */
  async record(actor: ActorContext, input: RecordFinancialTransactionInput): Promise<FinancialTransactionResponseDto> {
    const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
    if (!actorUserId) {
      throw new ConflictException(
        `No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`,
      );
    }

    const transaction = await this.financialTransactionRepository.createWithEvent({
      branchId: actor.branchId,
      type: input.type,
      sourceGroupId: input.sourceGroupId,
      giverPersonId: input.sourceGroupId ? undefined : actor.personId,
      channel: input.channel,
      amountMinor: BigInt(input.amountMinor),
      currency: input.currency ?? 'GHS',
      initialState: 'RECORDED',
      actorUserId,
    });
    return toResponseDto(transaction, actor.personId);
  }

  async getById(id: string): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.requireTransaction(id);
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  /** FR-STW-03/04's verification-queue/discrepancy-queue read. See
   * `FinancialTransactionRepository.findManyByBranch`'s doc comment for
   * why `recordedByPersonId` is left `null` in list results (avoiding an
   * N+1 join per row for a minimal queue view). */
  async listByBranch(actor: ActorContext, currentState?: string): Promise<FinancialTransactionResponseDto[]> {
    const transactions = await this.financialTransactionRepository.findManyByBranch(actor.branchId, currentState);
    return transactions.map((transaction) => toResponseDto(transaction, null));
  }

  /** FR-STW-03: `RECORDED -> VERIFIED`, or `FLAGGED`/`UNDER_INVESTIGATION
   * -> VERIFIED` once a discrepancy is resolved. BR-STW-04's same-actor
   * check has already run at the guard layer by the time this executes -
   * see this class's own doc comment. */
  async verify(actor: ActorContext, id: string): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.transitionTo(actor, id, 'VERIFIED');
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  /** FR-STW-04: `RECORDED -> FLAGGED` with a discrepancy reason, routing
   * to the "discrepancy queue" (`listByBranch(actor, 'FLAGGED')`). */
  async flag(actor: ActorContext, id: string, input: FlagFinancialTransactionInput): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.transitionTo(actor, id, 'FLAGGED', input.reason);
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  /**
   * PRD §12.7's `Flagged -> UnderInvestigation`: "discrepancy unresolved
   * past SLA." No SLA duration is specified anywhere in the PRD, and no
   * scheduler exists in this codebase to evaluate one automatically (the
   * same gap already flagged for Pastoral Care's silent-drift sweep and
   * Gatherings' completeness sweep) - this is a manual transition a
   * Treasurer/Admin invokes, not an automatic one. See
   * `STEWARDSHIP_DESIGN_NOTES.md`.
   */
  async escalate(actor: ActorContext, id: string): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.transitionTo(actor, id, 'UNDER_INVESTIGATION');
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  /** FR-STW-07: `VERIFIED -> RECONCILED`, "matched against bank
   * deposit." See `STEWARDSHIP_DESIGN_NOTES.md` for why the *comparison*
   * half of FR-STW-07 (an actual bank-deposit-confirmation record) is not
   * built this milestone - `db/schema.prisma` has no such entity; this
   * method only records the state transition itself. */
  async reconcile(actor: ActorContext, id: string): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.transitionTo(actor, id, 'RECONCILED');
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  private async requireTransaction(id: string): Promise<FinancialTransaction> {
    const transaction = await this.financialTransactionRepository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`No Financial Transaction found with id '${id}'`);
    }
    return transaction;
  }

  private async transitionTo(
    actor: ActorContext,
    id: string,
    to: InboundTransactionState,
    reason?: string,
  ): Promise<FinancialTransaction> {
    const existing = await this.requireTransaction(id);
    if (!isInboundTransactionState(existing.currentState)) {
      throw new ConflictException(
        `Financial Transaction '${id}' is in state '${existing.currentState}', which is not a recognized inbound state ` +
          '(it may be an Expense - use ExpenseService instead)',
      );
    }
    const check = checkInboundTransactionTransition(existing.currentState, to);
    if (!check.allowed) {
      throw new ConflictException(check.reason);
    }

    const actorUserId = await this.financialTransactionRepository.findUserIdByPersonId(actor.personId);
    if (!actorUserId) {
      throw new ConflictException(
        `No platform.users record links to Person '${actor.personId}' - cannot attribute this Financial Transaction event`,
      );
    }

    return this.financialTransactionRepository.appendEvent(id, existing.currentState, to, actorUserId, reason);
  }
}
