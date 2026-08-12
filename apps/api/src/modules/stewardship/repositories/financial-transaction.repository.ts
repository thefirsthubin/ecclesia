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
   *
   * `[Bug fix, Stewardship/Role Assignment RLS audit]` No longer wraps
   * these two statements in their own `this.prisma.$transaction(async
   * (tx) => ...)` - the exact same mistake found and fixed in
   * `GroupMembershipRepository.applyChange`. `$transaction` is
   * deliberately never proxied to the ambient branch-scoped connection
   * (`PrismaService`'s own doc comment), so that call opened a second,
   * brand-new Postgres transaction that never ran `runInBranchScope`'s
   * `SET LOCAL app.current_branch_id` - every RLS policy on
   * `stewardship.financial_transactions`/`financial_transaction_events`
   * then rejected the query with "unrecognized configuration parameter,"
   * a real 500 confirmed live against Postgres for both `record()`
   * (inbound) and `request()` (Expense - `ExpenseService.request` calls
   * this same method) call sites. `FinancialTransactionController`'s
   * `record` route (and `ExpenseController`'s `request` route) already
   * run inside exactly one `BranchScopeInterceptor`-opened
   * `runInBranchScope` transaction for the whole request - plain
   * sequential calls against `this.prisma` here share that same outer
   * transaction and remain atomic with each other.
   */
  async createWithEvent(input: CreateTransactionRecord): Promise<FinancialTransaction> {
    const transaction = await this.prisma.financialTransaction.create({
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
    await this.prisma.financialTransactionEvent.create({
      data: {
        transactionId: transaction.id,
        fromState: null,
        toState: input.initialState,
        actorUserId: input.actorUserId,
        reason: input.reason,
      },
    });
    return transaction;
  }

  /**
   * Appends a new event and mirrors its `toState` onto
   * `FinancialTransaction.currentState` - every state transition after
   * the initial one (verify, flag, escalate, reconcile, approve, reject,
   * pay, receipt) goes through this one method.
   *
   * `[Bug fix, Stewardship/Role Assignment RLS audit]` Same fix as
   * `createWithEvent` above - no nested `$transaction`, atomicity comes
   * from the one outer `runInBranchScope` transaction
   * `BranchScopeInterceptor` already opens for the whole request.
   */
  async appendEvent(
    transactionId: string,
    fromState: string,
    toState: string,
    actorUserId: string,
    reason?: string,
  ): Promise<FinancialTransaction> {
    await this.prisma.financialTransactionEvent.create({
      data: { transactionId, fromState, toState, actorUserId, reason },
    });
    return this.prisma.financialTransaction.update({
      where: { id: transactionId },
      data: { currentState: toState },
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

  /**
   * `[Resident Pastor Dashboard - real Giving data milestone]` The Giving
   * KPI/trend/growth-series' underlying query - adapted from
   * `sumVerifiedAmountByGroupForWeek` above for a Branch-wide total
   * instead of a per-Bacenta breakdown. Two deliberate differences from
   * that method, not oversights:
   *
   * 1. No `groupBy` - a single `aggregate({ _sum })`, the same shape
   *    `PledgeRepository`'s own `aggregate({ _sum: { pledgedAmountMinor: true } })`
   *    already uses for a plain branch/scope-wide sum.
   * 2. No `sourceGroupId: { not: null }` filter - that exclusion exists
   *    above specifically because a per-Bacenta reconciliation view has no
   *    Bacenta to attribute an individual gift to. A Branch-wide Giving
   *    total has no such reason to exclude individual
   *    Mobile-Money/Cash gifts (`giverPersonId` set, `sourceGroupId` null)
   *    - every verified inbound Financial Transaction counts, regardless
   *    of whether it came through a Bacenta or directly from a Person.
   *
   * `currentState: VERIFIED`/`RECONCILED` only (never `RECORDED`/`FLAGGED`/
   * `UNDER_INVESTIGATION`) - "Giving" means money a Treasurer has actually
   * confirmed, the same "verified" semantics this codebase's only other
   * branch-wide sum already established, not a new business rule.
   */
  async sumVerifiedAmountForBranch(branchId: string, from: Date, to: Date): Promise<bigint> {
    const result = await this.prisma.financialTransaction.aggregate({
      where: {
        branchId,
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        createdAt: { gte: from, lt: to },
      },
      _sum: { amountMinor: true },
    });
    return result._sum.amountMinor ?? 0n;
  }
}
