import { Injectable } from '@nestjs/common';
import type { FinancialTransaction, FinancialTransactionEvent, FinancialTransactionType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateTransactionRecord {
  branchId: string;
  type: FinancialTransactionType;
  sourceGroupId?: string;
  /** `[Milestone A: Financial + Gathering Backend Foundation]` The specific
   * Gathering occurrence this was given at - see `FinancialTransaction.gatheringId`'s
   * own doc comment in `db/schema.prisma`. Validated against `sourceGroupId`
   * (when both are set) and the actor's own Branch by
   * `FinancialTransactionService.record()` before this method is ever
   * called - this repository trusts its caller, the same division of
   * responsibility every other method here already assumes. */
  gatheringId?: string;
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
        gatheringId: input.gatheringId,
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
   * FR-STW-07's weekly reconciliation comparison, generalized (`[Milestone
   * A: Financial + Gathering Backend Foundation]`, renamed from
   * `sumVerifiedAmountByGroupForWeek`): for every Group with at least one
   * Verified-or-later (`VERIFIED`/`RECONCILED`) inbound transaction inside
   * `[from, to)`, the SUM of those transactions' `amountMinor`. This
   * method never actually hard-coded a one-week window - `weekStart`/
   * `weekEnd` were always plain `Date` bounds; only the name and its sole
   * caller's convention were week-specific. Renamed and given an optional
   * `type` filter (mirroring `findManyByBranch`'s own) so it can genuinely
   * serve week/month/arbitrary-range/year callers, per the approved
   * Milestone A design - `BankDepositConfirmationService.getWeeklyReconciliation`
   * keeps calling it with week-sized bounds and no `type`, unchanged
   * behavior. `sourceGroupId IS NOT NULL` excludes individual Mobile Money
   * entries (no Bacenta to reconcile against a bank deposit) - [INFERRED],
   * consistent with FR-STW-07's own "per Bacenta" framing.
   */
  async sumVerifiedAmountByGroupForRange(
    branchId: string,
    from: Date,
    to: Date,
    type?: FinancialTransactionType,
  ): Promise<{ sourceGroupId: string; totalAmountMinor: bigint }[]> {
    const grouped = await this.prisma.financialTransaction.groupBy({
      by: ['sourceGroupId'],
      where: {
        branchId,
        sourceGroupId: { not: null },
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        createdAt: { gte: from, lt: to },
        ...(type ? { type } : {}),
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
  async sumVerifiedAmountForBranch(branchId: string, from: Date, to: Date, type?: FinancialTransactionType): Promise<bigint> {
    const result = await this.prisma.financialTransaction.aggregate({
      where: {
        branchId,
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        createdAt: { gte: from, lt: to },
        ...(type ? { type } : {}),
      },
      _sum: { amountMinor: true },
    });
    return result._sum.amountMinor ?? 0n;
  }

  /**
   * `[Milestone C: Portal Read Models + Analytics]` The Giving Trend
   * read-model's raw row source. Returns every VERIFIED/RECONCILED row in
   * `[from, to]` **for the correct date**, per Phase 3's explicit
   * instruction: a row with a `gatheringId` is matched against that
   * Gathering's own `scheduledStart` (via the `gathering` relation
   * filter/select below), never its own `createdAt`; a row with no
   * `gatheringId` has no better date available and is matched/reported
   * against `createdAt` instead - the one honest fallback, not a silent
   * substitution for a "real" service date that doesn't exist for that
   * row. The caller (`GivingTrendService`) does the actual bucketing -
   * this method only fetches the candidate rows and each one's resolved
   * date, deliberately not aggregating in SQL, since the two different
   * date sources per row make a single `groupBy` impossible without a
   * raw-SQL `CASE` expression this codebase's own conventions avoid in
   * favor of small, explicit application-layer composition (the same
   * choice `BranchDashboardSummaryService`/`PastoralCalendarService`
   * already make elsewhere).
   */
  listVerifiedForTrend(
    branchId: string,
    from: Date,
    to: Date,
    types: FinancialTransactionType[],
    sourceGroupIds?: string[],
  ): Promise<VerifiedTransactionForTrendRow[]> {
    return this.prisma.financialTransaction.findMany({
      where: {
        branchId,
        currentState: { in: ['VERIFIED', 'RECONCILED'] },
        type: { in: types },
        ...(sourceGroupIds ? { sourceGroupId: { in: sourceGroupIds } } : {}),
        OR: [
          { gatheringId: { not: null }, gathering: { scheduledStart: { gte: from, lte: to } } },
          { gatheringId: null, createdAt: { gte: from, lte: to } },
        ],
      },
      select: {
        id: true,
        type: true,
        amountMinor: true,
        sourceGroupId: true,
        gatheringId: true,
        createdAt: true,
        gathering: { select: { scheduledStart: true, type: true } },
      },
    });
  }
}

/** Row shape returned by `listVerifiedForTrend` - `gathering` is Prisma's
 * own nested-select result (`null` when `gatheringId` is null), read
 * directly by `GivingTrendService` to resolve each row's true date. */
export interface VerifiedTransactionForTrendRow {
  id: string;
  type: FinancialTransactionType;
  amountMinor: bigint;
  sourceGroupId: string | null;
  gatheringId: string | null;
  createdAt: Date;
  gathering: { scheduledStart: Date; type: string } | null;
}
