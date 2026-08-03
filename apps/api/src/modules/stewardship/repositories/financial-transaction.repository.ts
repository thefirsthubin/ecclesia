import { Injectable } from '@nestjs/common';
import type { FinancialTransaction, FinancialTransactionEvent, FinancialTransactionType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateTransactionRecord {
  branchId: string;
  type: FinancialTransactionType;
  sourceGroupId?: string;
  giverPersonId?: string;
  channel?: 'CASH' | 'MOBILE_MONEY';
  amountMinor: bigint;
  currency: string;
  /** Initial state (the first `FinancialTransactionEvent.toState`), e.g.
   * `'RECORDED'` for an inbound gift or `'REQUESTED'` for an Expense. */
  initialState: string;
  actorUserId: string;
  reason?: string;
}

/**
 * Prisma-backed persistence for `stewardship.financial_transactions` and
 * its append-only `stewardship.financial_transaction_events` log
 * (Blueprint §7.4, `db/schema.prisma`'s own doc comment: "No update/delete
 * allowed" - enforced at the database-role/trigger level per
 * `db/DESIGN_NOTES.md` Open Question #2, not by this repository omitting
 * an `update`/`delete` method, though it does that too as defense in
 * depth). `FinancialTransaction.currentState` is a denormalized mirror of
 * the latest event's `toState`, kept in sync in the same transaction as
 * each new event (`db/schema.prisma`'s own doc comment on that field).
 */
@Injectable()
export class FinancialTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates the `FinancialTransaction` row and its first
   * `FinancialTransactionEvent` (`fromState: null`) atomically - PRD
   * §12.7's `[*] --> Recorded`/`[*] --> Requested` initial transitions.
   */
  createWithEvent(input: CreateTransactionRecord): Promise<FinancialTransaction> {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.financialTransaction.create({
        data: {
          branchId: input.branchId,
          type: input.type,
          sourceGroupId: input.sourceGroupId,
          giverPersonId: input.giverPersonId,
          channel: input.channel,
          amountMinor: input.amountMinor,
          currency: input.currency,
          currentState: input.initialState,
        },
      });
      await tx.financialTransactionEvent.create({
        data: {
          transactionId: transaction.id,
          fromState: null,
          toState: input.initialState,
          actorUserId: input.actorUserId,
          reason: input.reason,
        },
      });
      return transaction;
    });
  }

  /**
   * Appends a new event and mirrors its `toState` onto
   * `FinancialTransaction.currentState`, atomically - every state
   * transition after the initial one (verify, flag, reconcile, approve,
   * reject, pay, receipt) goes through this one method.
   */
  appendEvent(
    transactionId: string,
    fromState: string,
    toState: string,
    actorUserId: string,
    reason?: string,
  ): Promise<FinancialTransaction> {
    return this.prisma.$transaction(async (tx) => {
      await tx.financialTransactionEvent.create({
        data: { transactionId, fromState, toState, actorUserId, reason },
      });
      return tx.financialTransaction.update({
        where: { id: transactionId },
        data: { currentState: toState },
      });
    });
  }

  findById(id: string): Promise<FinancialTransaction | null> {
    return this.prisma.financialTransaction.findUnique({ where: { id } });
  }

  /** FR-STW-03/04's "verification queue"/"discrepancy queue" - a minimal
   * single-Branch, single-state filter. Full pagination and the
   * multi-filter (date range, type, Bacenta) reporting surface FR-STW-07
   * eventually needs is not built here - see
   * `STEWARDSHIP_DESIGN_NOTES.md`. `type` (Stewardship Web Admin sprint)
   * is a second optional filter - `ExpenseService.list` uses it to
   * narrow to `type: 'EXPENSE'` rows only, the same underlying table the
   * inbound queue already queries (`Expense` is a 1:1 extension of this
   * table, not a separate one - `db/DESIGN_NOTES.md` Open Question #5).
   * `sourceGroupId` (Stewardship gaps sprint) is a third optional filter -
   * `FinancialTransactionService.listByBranch` uses it to narrow a
   * BACENTA_LEADER's own list to just their own Bacenta's recorded
   * offerings, closing the "no Bacenta Leader list view" gap flagged in
   * `STEWARDSHIP_DESIGN_NOTES.md`. */
  findManyByBranch(
    branchId: string,
    currentState?: string,
    type?: FinancialTransactionType,
    sourceGroupId?: string,
  ): Promise<FinancialTransaction[]> {
    return this.prisma.financialTransaction.findMany({
      where: {
        branchId,
        ...(currentState ? { currentState } : {}),
        ...(type ? { type } : {}),
        ...(sourceGroupId ? { sourceGroupId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Finds the event that first moved this transaction into `toState`
   * (there can only be one per state in this codebase's forward-only
   * model - `libs/domain/stewardship`'s transition checks never allow
   * re-entering a state already visited). Used to resolve "who recorded
   * this" (`toState: 'RECORDED'`) for `DIFFERENT_ACTOR_THAN_RECORDER`
   * (PRD §17.4/BR-STW-04).
   */
  findFirstEventByToState(transactionId: string, toState: string): Promise<FinancialTransactionEvent | null> {
    return this.prisma.financialTransactionEvent.findFirst({
      where: { transactionId, toState },
      orderBy: { occurredAt: 'asc' },
    });
  }

  /** Reverse of `RoleAssignmentRepository.findUserIdByPersonId` - see that
   * method's doc comment for why a direct `prisma.user` query is
   * appropriate here (`platform.users` is shared infrastructure, not
   * another bounded context's private schema, Blueprint §7.2). */
  async findUserIdByPersonId(personId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({ where: { personId }, select: { id: true } });
    return user?.id;
  }

  async findPersonIdByUserId(userId: string): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { personId: true } });
    return user?.personId ?? undefined;
  }

  /**
   * Composes `findFirstEventByToState(transactionId, 'RECORDED')` +
   * `findPersonIdByUserId` into the one fact both
   * `FinancialTransactionResourceContextGuard` (building
   * `ResourceContext.recordedByPersonId` for `DIFFERENT_ACTOR_THAN_RECORDER`)
   * and `FinancialTransactionService` (populating the response DTO's own
   * `recordedByPersonId`) need, so neither reimplements the two-step join.
   */
  async findRecordedByPersonId(transactionId: string): Promise<string | undefined> {
    const recordedEvent = await this.findFirstEventByToState(transactionId, 'RECORDED');
    if (!recordedEvent) {
      return undefined;
    }
    return this.findPersonIdByUserId(recordedEvent.actorUserId);
  }

  /**
   * FR-STW-07's weekly reconciliation comparison: for every Bacenta with
   * at least one Verified-or-later (`VERIFIED`/`RECONCILED`) inbound
   * transaction inside `[weekStart, weekEnd)`, the SUM of those
   * transactions' `amountMinor`. `sourceGroupId IS NOT NULL` excludes
   * individual Mobile Money entries (no Bacenta to reconcile against a
   * bank deposit) - [INFERRED], consistent with FR-STW-07's own "per
   * Bacenta" framing. See `BankDepositConfirmationService.getWeeklyReconciliation`.
   */
  async sumVerifiedAmountByGroupForWeek(branchId: string, weekStart: Date, weekEnd: Date): Promise<{ sourceGroupId: string; totalAmountMinor: bigint }[]> {
    const grouped = await this.prisma.financialTransaction.groupBy({
      by: ['sourceGroupId'],
      where: {
        branchId,
        sourceGroupId: { not: null },
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        createdAt: { gte: weekStart, lt: weekEnd },
      },
      _sum: { amountMinor: true },
    });
    return grouped
      .filter((row) => row.sourceGroupId !== null)
      .map((row) => ({
        sourceGroupId: row.sourceGroupId as string,
        totalAmountMinor: row._sum.amountMinor ?? 0n,
      }));
  }
}
