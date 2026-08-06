/**
 * PRD §12.7's two sub-flows under the single `FinancialTransaction`
 * entity. `db/schema.prisma`'s `FinancialTransactionEvent.fromState`/
 * `toState` are free-form strings, not a fixed Prisma enum (its own doc
 * comment: "the real state machine has 8+ states across two sub-flows") -
 * this module is where those literal string values are actually pinned
 * down and validated, mirroring `libs/domain/gatherings`'
 * `gathering-status.ts` precedent for an untyped-string Prisma column
 * backed by a real domain state machine.
 *
 * [INFERRED] casing: the PRD's Mermaid diagrams write state names in
 * PascalCase (`Recorded`, `Verified`, ...). This module represents them
 * as SCREAMING_SNAKE_CASE string literals instead, matching every other
 * enum-shaped value in this codebase (`GatheringStatus`, `AttendanceStatus`,
 * `FollowUpTaskStatus`, ...) for consistency across the API surface. The
 * *set* of states and the transitions between them are
 * `[BLUEPRINT-EXACT]`, transcribed directly from PRD §12.7's two
 * `stateDiagram-v2` blocks; only the string casing is a stylistic choice.
 */

export const INBOUND_TRANSACTION_STATES = [
  'RECORDED',
  'VERIFIED',
  'FLAGGED',
  'UNDER_INVESTIGATION',
  'RECONCILED',
] as const;
export type InboundTransactionState = (typeof INBOUND_TRANSACTION_STATES)[number];

export function isInboundTransactionState(value: string): value is InboundTransactionState {
  return (INBOUND_TRANSACTION_STATES as readonly string[]).includes(value);
}

const INBOUND_TRANSITIONS: Record<InboundTransactionState, readonly InboundTransactionState[]> = {
  RECORDED: ['VERIFIED', 'FLAGGED'],
  VERIFIED: ['RECONCILED'],
  FLAGGED: ['VERIFIED', 'UNDER_INVESTIGATION'],
  UNDER_INVESTIGATION: ['VERIFIED'],
  RECONCILED: [],
};

export const OUTBOUND_TRANSACTION_STATES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'RECEIPT_RETAINED'] as const;
export type OutboundTransactionState = (typeof OUTBOUND_TRANSACTION_STATES)[number];

export function isOutboundTransactionState(value: string): value is OutboundTransactionState {
  return (OUTBOUND_TRANSACTION_STATES as readonly string[]).includes(value);
}

const OUTBOUND_TRANSITIONS: Record<OutboundTransactionState, readonly OutboundTransactionState[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PAID'],
  REJECTED: [],
  PAID: ['RECEIPT_RETAINED'],
  RECEIPT_RETAINED: [],
};

export interface TransactionStatusTransitionCheck {
  allowed: boolean;
  reason: string;
}

function checkTransition<S extends string>(
  from: S,
  to: S,
  transitions: Record<S, readonly S[]>,
  label: string,
): TransactionStatusTransitionCheck {
  if (from === to) {
    return { allowed: false, reason: `'${from}' is already the current state; not a transition` };
  }
  const allowedNext = transitions[from];
  if (!allowedNext.includes(to)) {
    return {
      allowed: false,
      reason: `PRD §12.7 (${label}): '${from}' -> '${to}' is not a modeled transition (allowed: ${
        allowedNext.length > 0 ? allowedNext.join(', ') : 'none - terminal state'
      })`,
    };
  }
  return { allowed: true, reason: `PRD §12.7 (${label}): '${from}' -> '${to}' is a modeled transition` };
}

/**
 * Inbound sub-flow (Offering/Tithe/Special Offering/Pledge/Donation).
 * `RECORDED -> FLAGGED` is FR-STW-04 (a Treasurer finds a discrepancy);
 * `FLAGGED -> UNDER_INVESTIGATION` is the "discrepancy unresolved past
 * SLA" edge - modeled as a reachable state here, but see
 * `apps/api/src/modules/stewardship/STEWARDSHIP_DESIGN_NOTES.md` for why
 * nothing in this milestone triggers that transition *automatically* (no
 * SLA duration is specified anywhere in the PRD, and no scheduler exists
 * in this codebase yet - the same "no scheduler" gap already flagged for
 * Pastoral Care's silent-drift sweep and Gatherings' completeness sweep).
 */
export function checkInboundTransactionTransition(
  from: InboundTransactionState,
  to: InboundTransactionState,
): TransactionStatusTransitionCheck {
  return checkTransition(from, to, INBOUND_TRANSITIONS, 'inbound');
}

/**
 * Outbound sub-flow (Expense). FR-STW-09: `ReceiptRetained` (terminal)
 * cannot be reached without an attached receipt - that precondition is
 * enforced by `ExpenseService`, not this pure function, since it depends
 * on `Expense.receiptStorageKey` being populated, which is data this
 * module has no access to (Blueprint §6.4: domain libraries are
 * framework/persistence-agnostic).
 */
export function checkOutboundTransactionTransition(
  from: OutboundTransactionState,
  to: OutboundTransactionState,
): TransactionStatusTransitionCheck {
  return checkTransition(from, to, OUTBOUND_TRANSITIONS, 'outbound/Expense');
}
