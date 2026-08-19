import { randomUUID } from 'crypto';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { checkInboundTransactionTransition, isInboundTransactionState } from '@ecclesia/domain-stewardship';
import type { InboundTransactionState } from '@ecclesia/domain-stewardship';
import type {
  PublishableEngagementSignal,
  FinancialTransactionResponseDto,
  FinancialTransactionSummaryResponseDto,
  FinancialTransactionSummaryRowDto,
  FlagFinancialTransactionInput,
  RecordFinancialTransactionInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { FinancialTransaction, FinancialTransactionType } from '@prisma/client';

import { GatheringScopeService } from '../../gatherings/services/gathering-scope.service';
import { EventBridgePublisherService } from '../../../platform/events/eventbridge-publisher.service';
import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';
import type { VerifiedTransactionForTrendRow } from '../repositories/financial-transaction.repository';

function toResponseDto(transaction: FinancialTransaction, recordedByPersonId: string | null): FinancialTransactionResponseDto {
  return {
    id: transaction.id,
    branchId: transaction.branchId,
    type: transaction.type,
    sourceGroupId: transaction.sourceGroupId,
    gatheringId: transaction.gatheringId,
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
  constructor(
    private readonly financialTransactionRepository: FinancialTransactionRepository,
    private readonly eventPublisher: EventBridgePublisherService,
    private readonly gatheringScopeService: GatheringScopeService,
  ) {}

  /**
   * FR-STW-01/BR-STW-01/BR-STW-02: `sourceGroupId` present means a
   * Bacenta-collected offering (`giverPersonId` left unset - the giver is
   * the Bacenta as a collection point, not one individual); absent means
   * an individual Mobile Money entry, whose `giverPersonId` is always the
   * *acting* Person - see `recordFinancialTransactionSchema`'s doc comment
   * in `libs/contracts` for why this is never taken from client input.
   *
   * `[Milestone A: Financial + Gathering Backend Foundation]` When
   * `input.gatheringId` is supplied, this method validates it before
   * writing anything - the approved design's own invariants, enforced here
   * (application layer) rather than a DB constraint, since "does this
   * Gathering belong to my Branch" and "does its ownerGroupId agree with
   * sourceGroupId" both need to read a second table, which a plain
   * Postgres `CHECK` can't express:
   *
   * 1. The referenced Gathering must exist and belong to `actor.branchId` -
   *    otherwise a cross-Branch id (however unlikely to be guessed) could
   *    link a transaction to a Gathering RLS would never let this actor
   *    read back.
   * 2. If the Gathering has a non-null `ownerGroupId` (a Bacenta/Basonta
   *    meeting, not a Branch-wide Sunday/Midweek/Other service) AND
   *    `input.sourceGroupId` is also set, they must be equal - closes the
   *    cross-Bacenta-attribution risk this exact field introduces (see
   *    MILESTONE_A_DESIGN_NOTES.md Part 7): without this check, a
   *    `BACENTA_LEADER`'s OWN_GROUP scope check would still pass (it's
   *    evaluated against `sourceGroupId`, not `gatheringId`), but the
   *    stored row could reference a foreign Bacenta's meeting, corrupting
   *    that Gathering's own future linked-giving view.
   * 3. A Branch-wide Gathering (`ownerGroupId: null` - Sunday/Midweek/
   *    Other) imposes no such match - a Bacenta's collection folded into a
   *    combined Sunday offering is a legitimate, real scenario.
   */
  async record(actor: ActorContext, input: RecordFinancialTransactionInput): Promise<FinancialTransactionResponseDto> {
    if (input.gatheringId) {
      const gatheringScope = await this.gatheringScopeService.loadScope(input.gatheringId);
      if (gatheringScope.branchId !== actor.branchId) {
        throw new ConflictException(`Gathering '${input.gatheringId}' does not belong to this Branch`);
      }
      if (gatheringScope.ownerGroupId && input.sourceGroupId && gatheringScope.ownerGroupId !== input.sourceGroupId) {
        throw new ConflictException(
          `Gathering '${input.gatheringId}' belongs to Group '${gatheringScope.ownerGroupId}', which does not match sourceGroupId '${input.sourceGroupId}'`,
        );
      }
    }

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
      gatheringId: input.gatheringId,
      giverPersonId: input.sourceGroupId ? undefined : actor.personId,
      channel: input.channel,
      amountMinor: BigInt(input.amountMinor),
      currency: input.currency ?? 'GHS',
      initialState: 'RECORDED',
      actorUserId,
    });

    // `[Engagement Signal Ingestion Pipeline milestone]` Blueprint §10.4's
    // `giving.activity_recorded` (normalized for PRD §17.6's privacy
    // boundary: personId + occurredAt only - no amount, transaction id, or
    // channel; `payload` is deliberately empty). Only published when there
    // is an individual `giverPersonId` to attribute it to - a
    // Bacenta-collected offering (`sourceGroupId` set) has no individual
    // giver by design (see this method's own doc comment above), so there
    // is no Person whose engagement this fact could legitimately signal.
    if (transaction.giverPersonId) {
      const envelope: PublishableEngagementSignal = {
        eventId: randomUUID(),
        eventType: 'giving.activity_recorded',
        schemaVersion: 1,
        branchId: transaction.branchId,
        occurredAt: transaction.createdAt.toISOString(),
        subjectPersonId: transaction.giverPersonId,
        payload: {},
      };
      await this.eventPublisher.publish(envelope);
    }

    return toResponseDto(transaction, actor.personId);
  }

  async getById(id: string): Promise<FinancialTransactionResponseDto> {
    const transaction = await this.requireTransaction(id);
    const recordedByPersonId = await this.financialTransactionRepository.findRecordedByPersonId(id);
    return toResponseDto(transaction, recordedByPersonId ?? null);
  }

  /**
   * FR-STW-03/04's verification-queue/discrepancy-queue read. See
   * `FinancialTransactionRepository.findManyByBranch`'s doc comment for
   * why `recordedByPersonId` is left `null` in list results (avoiding an
   * N+1 join per row for a minimal queue view).
   *
   * `[Stewardship gaps sprint]` When `actor.bacentaId` is set (a
   * BACENTA_LEADER's own single-Bacenta scope), the list narrows to just
   * that Bacenta's own recorded offerings - closes the "no Bacenta
   * Leader list view" gap `STEWARDSHIP_DESIGN_NOTES.md` flagged
   * (previously they could only fetch a transaction by an already-known
   * id, never list what they themselves recorded).
   * `FinancialTransactionListResourceContextGuard` now also populates
   * `resource.bacentaId` from the same fact, so RBAC's OWN_GROUP scope
   * check (`stewardship.transaction.read`'s BACENTA_LEADER row) actually
   * passes for this endpoint - see that guard's own doc comment.
   */
  /**
   * `[Milestone A: Financial + Gathering Backend Foundation]` `type`/
   * `sourceGroupId` are new optional filters (`listFinancialTransactionsQuerySchema`).
   * `actor.bacentaId`, when present, still wins over an explicit
   * `sourceGroupId` query param - a `BACENTA_LEADER`'s OWN_GROUP scope is
   * enforced by always narrowing to their own Bacenta server-side, not by
   * trusting a client-supplied filter; a BRANCH-scoped actor (Treasurer/
   * Resident Pastor) has no `bacentaId`, so their own explicit
   * `sourceGroupId` filter (if any) passes through untouched.
   *
   * `[Milestone C: Portal Read Models + Analytics, bug fix]` `actor.basontaId`
   * narrows the same way, for a `BASONTA_LEADER` - discovered live while
   * verifying Phase 1 decision #7's read parity grant: this method
   * previously only ever checked `actor.bacentaId`, so even after the
   * resource-context guard fix (above), a Basonta Leader's own list would
   * have silently fallen through to `sourceGroupId` (an unset,
   * client-supplied filter), the same class of "half-fixed" gap this
   * milestone's own cluster-narrowing fix elsewhere took care to avoid.
   */
  async listByBranch(actor: ActorContext, currentState?: string, type?: FinancialTransactionType, sourceGroupId?: string): Promise<FinancialTransactionResponseDto[]> {
    const ownGroupId = actor.bacentaId ?? actor.basontaId;
    const transactions = ownGroupId
      ? await this.financialTransactionRepository.findManyByBranch(actor.branchId, currentState, type, ownGroupId)
      : await this.financialTransactionRepository.findManyByBranch(actor.branchId, currentState, type, sourceGroupId);
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

  /** `[Resident Pastor Dashboard - real Giving data milestone]` Thin
   * passthrough - see `FinancialTransactionRepository.sumVerifiedAmountForBranch`'s
   * own doc comment. No `actor`/authorization parameter, matching this
   * module's other cross-module-consumed methods elsewhere in this
   * codebase - the caller (`BranchDashboardSummaryService`) is only ever
   * reached from an already-RBAC-guarded controller route. `type` is new
   * (`[Milestone A]`) and optional - `BranchDashboardSummaryService`'s
   * existing call site is unaffected, passing none. */
  sumVerifiedAmountForBranch(branchId: string, from: Date, to: Date, type?: FinancialTransactionType): Promise<bigint> {
    return this.financialTransactionRepository.sumVerifiedAmountForBranch(branchId, from, to, type);
  }

  /** `[Milestone C: Portal Read Models + Analytics]` Thin passthrough -
   * see `FinancialTransactionRepository.listVerifiedForTrend`'s own doc
   * comment. Consumed by `GivingTrendService` (`apps/api/src/modules/insights`). */
  listVerifiedForTrend(
    branchId: string,
    from: Date,
    to: Date,
    types: FinancialTransactionType[],
    sourceGroupIds?: string[],
  ): Promise<VerifiedTransactionForTrendRow[]> {
    return this.financialTransactionRepository.listVerifiedForTrend(branchId, from, to, types, sourceGroupIds);
  }

  /**
   * `[Milestone A: Financial + Gathering Backend Foundation]` `GET
   * /financial-transactions/summary` - the generalized Giving-analytics
   * read model the approved design calls for, unifying
   * `sumVerifiedAmountForBranch` (branch-wide total) and
   * `sumVerifiedAmountByGroupForRange` (per-group breakdown) behind one
   * response shape rather than a union type: `groupBy=none` returns
   * exactly one row with `sourceGroupId: null` standing in for "the whole
   * branch, as if it were one group." `actor.bacentaId`/`actor.basontaId`
   * (`[Milestone C]` the latter added as a bug fix - see `listByBranch`'s
   * own doc comment for the discovery), when present, narrows
   * `groupBy=group` to that one Bacenta/Basonta's own row only (mirroring
   * `listByBranch`'s own OWN_GROUP-scope handling) and forces `groupBy=none`
   * regardless of what was requested, since a single-Group-scoped actor
   * has no meaningful "per group" breakdown beyond their own one group.
   */
  async summarize(
    actor: ActorContext,
    from: Date,
    to: Date,
    type?: FinancialTransactionType,
    groupBy: 'none' | 'group' = 'none',
  ): Promise<FinancialTransactionSummaryResponseDto> {
    const ownGroupId = actor.bacentaId ?? actor.basontaId;
    const effectiveGroupBy = ownGroupId ? 'none' : groupBy;

    let rows: FinancialTransactionSummaryRowDto[];
    if (effectiveGroupBy === 'group') {
      const grouped = await this.financialTransactionRepository.sumVerifiedAmountByGroupForRange(actor.branchId, from, to, type);
      rows = grouped.map((row) => ({ sourceGroupId: row.sourceGroupId, totalAmountMinor: row.totalAmountMinor.toString() }));
    } else if (ownGroupId) {
      const grouped = await this.financialTransactionRepository.sumVerifiedAmountByGroupForRange(actor.branchId, from, to, type);
      const own = grouped.find((row) => row.sourceGroupId === ownGroupId);
      rows = [{ sourceGroupId: ownGroupId, totalAmountMinor: (own?.totalAmountMinor ?? 0n).toString() }];
    } else {
      const total = await this.financialTransactionRepository.sumVerifiedAmountForBranch(actor.branchId, from, to, type);
      rows = [{ sourceGroupId: null, totalAmountMinor: total.toString() }];
    }

    return {
      branchId: actor.branchId,
      from: from.toISOString(),
      to: to.toISOString(),
      type: type ?? null,
      groupBy: effectiveGroupBy,
      rows,
    };
  }
}
