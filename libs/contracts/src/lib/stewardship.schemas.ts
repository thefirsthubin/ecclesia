import { z } from 'zod';

/**
 * Shared Zod schemas for the Stewardship bounded context (PRD §13.5). See
 * `people.schemas.ts`'s own doc comment for why enums are re-declared
 * here rather than imported - `libs/contracts` is a leaf library.
 *
 * **`amountMinor` is a decimal string on the wire, never a JSON number.**
 * `db/schema.prisma`'s `FinancialTransaction.amountMinor`/
 * `Expense`/`Project`/`Pledge`'s equivalent fields are Prisma `BigInt`
 * (Blueprint §7.4: minor currency units, avoiding float rounding error).
 * `BigInt` cannot round-trip through `JSON.stringify`/`JSON.parse` at all
 * (it throws), and a plain JS `number` loses precision past 2^53 - a
 * decimal string is the only lossless wire representation. Every
 * `amountMinor`-shaped field below is `z.string().regex(/^[0-9]+$/)` on
 * both the request and response schemas; conversion to/from Prisma's
 * native `BigInt` happens only at the repository boundary
 * (`apps/api/src/modules/stewardship`), never here.
 */

const amountMinorSchema = z
  .string()
  .regex(/^[0-9]+$/, 'amountMinor must be a non-negative integer string of minor currency units');

/// [PRD-DERIVED] NFR-L10N-02: "Financial Transaction entities carry an
/// explicit currency field" - ISO 4217, defaulting to GHS per the
/// reference deployment.
const currencySchema = z.string().length(3).default('GHS');

export const FINANCIAL_TRANSACTION_TYPE_VALUES = ['OFFERING', 'TITHE', 'SPECIAL_OFFERING', 'PLEDGE', 'DONATION', 'EXPENSE'] as const;
export const financialTransactionTypeSchema = z.enum(FINANCIAL_TRANSACTION_TYPE_VALUES);
export type FinancialTransactionTypeDto = z.infer<typeof financialTransactionTypeSchema>;

export const FINANCIAL_TRANSACTION_CHANNEL_VALUES = ['CASH', 'MOBILE_MONEY'] as const;
export const financialTransactionChannelSchema = z.enum(FINANCIAL_TRANSACTION_CHANNEL_VALUES);
export type FinancialTransactionChannelDto = z.infer<typeof financialTransactionChannelSchema>;

export const INBOUND_TRANSACTION_STATE_VALUES = ['RECORDED', 'VERIFIED', 'FLAGGED', 'UNDER_INVESTIGATION', 'RECONCILED'] as const;
export const inboundTransactionStateSchema = z.enum(INBOUND_TRANSACTION_STATE_VALUES);
export type InboundTransactionStateDto = z.infer<typeof inboundTransactionStateSchema>;

export const OUTBOUND_TRANSACTION_STATE_VALUES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'RECEIPT_RETAINED'] as const;
export const outboundTransactionStateSchema = z.enum(OUTBOUND_TRANSACTION_STATE_VALUES);
export type OutboundTransactionStateDto = z.infer<typeof outboundTransactionStateSchema>;

export const PROJECT_STATUS_VALUES = ['ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export const projectStatusSchema = z.enum(PROJECT_STATUS_VALUES);
export type ProjectStatusDto = z.infer<typeof projectStatusSchema>;

/**
 * FR-STW-01/05: "record an inbound Financial Transaction (Offering,
 * Tithe, or Special Offering)... recording the giving channel." `type`
 * excludes `EXPENSE` (that sub-flow is `requestExpenseSchema` below,
 * FR-STW-09) but includes `PLEDGE`/`DONATION` - [INFERRED] a Pledge's
 * actual *payment* is recorded through this same inbound flow like any
 * other gift, then optionally linked back to its originating `Pledge` row
 * via `fulfillPledgeSchema`; the PRD does not spell out this linkage
 * step-by-step. `channel` is required here (not optional, unlike the
 * underlying nullable DB column, which also serves `Expense` rows that
 * have no channel at all) per FR-STW-05's "every inbound transaction has
 * a non-null channel value."
 *
 * **No client-supplied `giverPersonId`.** §12.7's edge case says an
 * individual Mobile Money transaction's "`source` is the giving Person
 * directly" - which for the SELF-scoped Treasurer/Member `record` rows in
 * `permission-matrix.ts` must always be the *acting* Person (RBAC's own
 * `SELF` scope check is `resource.ownerId === actor.personId`, per
 * `evaluate.ts`). Accepting a client-supplied `giverPersonId` would let an
 * actor claim to record a gift "on behalf of" an arbitrary other Person
 * while still passing the SELF scope check written against their own
 * identity - `FinancialTransactionService.record()` always sets
 * `giverPersonId` to `actor.personId` itself when no `sourceGroupId` is
 * given, never from client input.
 */
export const recordFinancialTransactionSchema = z.object({
  type: financialTransactionTypeSchema.exclude(['EXPENSE']),
  sourceGroupId: z.string().uuid().optional(),
  /**
   * `[Milestone A: Financial + Gathering Backend Foundation]` The specific
   * Gathering occurrence this was given at - optional, and expected to
   * stay optional (not every gift has one obvious Gathering to attach to,
   * e.g. an ad-hoc Mobile Money gift on an ordinary day). When both this
   * and `sourceGroupId` are set, `FinancialTransactionService.record()`
   * requires them to agree with the referenced Gathering's own
   * `ownerGroupId` (when it has one) - see that method's own doc comment.
   */
  gatheringId: z.string().uuid().optional(),
  channel: financialTransactionChannelSchema,
  amountMinor: amountMinorSchema,
  currency: currencySchema.optional(),
});
export type RecordFinancialTransactionInput = z.infer<typeof recordFinancialTransactionSchema>;

/**
 * `[Milestone A: Financial + Gathering Backend Foundation]` `GET
 * /financial-transactions`'s query - previously validated by nothing at
 * all (`@Query('state') state?: string` directly on the controller),
 * unlike `listGatheringsQuerySchema`'s established precedent on the
 * sibling Gatherings module. `type` excludes `EXPENSE` for the same reason
 * `recordFinancialTransactionSchema` does - `ExpenseService.list` already
 * owns the `type: 'EXPENSE'` case via its own hardcoded filter, so this
 * inbound-giving-queue route should not become a second door to the same
 * rows. `sourceGroupId` was already supported by the repository
 * (`findManyByBranch`) but never exposed as an explicit filter - added so
 * a BRANCH-scoped Treasurer/Admin can browse one Bacenta's transactions
 * without a separate endpoint (a `BACENTA_LEADER`'s own OWN_GROUP scope
 * already narrows server-side regardless of this param, unchanged).
 */
export const listFinancialTransactionsQuerySchema = z.object({
  state: z.string().trim().min(1).optional(),
  type: financialTransactionTypeSchema.exclude(['EXPENSE']).optional(),
  sourceGroupId: z.string().uuid().optional(),
});
export type ListFinancialTransactionsQuery = z.infer<typeof listFinancialTransactionsQuerySchema>;

/** FR-STW-04: "mark a transaction Flagged with a reason." */
export const flagFinancialTransactionSchema = z.object({
  reason: z.string().trim().min(1, 'reason is required'),
});
export type FlagFinancialTransactionInput = z.infer<typeof flagFinancialTransactionSchema>;

export const financialTransactionResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  type: financialTransactionTypeSchema,
  sourceGroupId: z.string().uuid().nullable(),
  gatheringId: z.string().uuid().nullable(),
  giverPersonId: z.string().uuid().nullable(),
  channel: financialTransactionChannelSchema.nullable(),
  amountMinor: amountMinorSchema,
  currency: z.string().length(3),
  currentState: z.string(),
  /** [INFERRED] Resolved by the service from the `RECORDED` event's
   * `actorUserId` -> `Person.id` (Blueprint §9.4 / PRD §17.4's
   * `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs this same
   * fact at the guard layer; surfacing it on the response DTO too lets a
   * verification-queue UI show who recorded each entry). `null` only in
   * the theoretical case no `RECORDED` event exists for this transaction,
   * which the service never itself produces. */
  recordedByPersonId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});
export type FinancialTransactionResponseDto = z.infer<typeof financialTransactionResponseSchema>;

/**
 * FR-STW-09: expense request/approve/reject/pay/receipt. Modeled as a 1:1
 * extension of `FinancialTransaction` (`type=EXPENSE`) per
 * `db/DESIGN_NOTES.md` Open Question #5.
 */
export const requestExpenseSchema = z.object({
  amountMinor: amountMinorSchema,
  currency: currencySchema.optional(),
  description: z.string().trim().min(1, 'description is required'),
  category: z.string().trim().min(1).optional(),
});
export type RequestExpenseInput = z.infer<typeof requestExpenseSchema>;

/** FR-STW-09: rejection requires a reason, matching
 * `flagFinancialTransactionSchema`'s own shape - both are a designated
 * reviewer explaining a non-default outcome. */
export const rejectExpenseSchema = z.object({
  reason: z.string().trim().min(1, 'reason is required'),
});
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;

/** BR-STW-08: "receipts are retained for all expenses" -
 * `receiptStorageKey` mirrors `Expense.receiptStorageKey`'s own naming;
 * this milestone does not implement the file upload itself (out of scope
 * for an application-layer/API milestone - see
 * `STEWARDSHIP_DESIGN_NOTES.md`), only recording the storage key of an
 * already-uploaded receipt. */
export const attachExpenseReceiptSchema = z.object({
  receiptStorageKey: z.string().trim().min(1, 'receiptStorageKey is required'),
});
export type AttachExpenseReceiptInput = z.infer<typeof attachExpenseReceiptSchema>;

export const expenseResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  transactionId: z.string().uuid(),
  requestedByPersonId: z.string().uuid(),
  description: z.string(),
  category: z.string().nullable(),
  receiptStorageKey: z.string().nullable(),
  approvedByPersonId: z.string().uuid().nullable(),
  approvedAt: z.string().datetime().nullable(),
  amountMinor: amountMinorSchema,
  currency: z.string().length(3),
  currentState: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ExpenseResponseDto = z.infer<typeof expenseResponseSchema>;

/** FR-STW-08/H2: Project entities against which Pledges are tracked. */
export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  description: z.string().trim().min(1).optional(),
  targetAmountMinor: amountMinorSchema,
  currency: currencySchema.optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const projectResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  targetAmountMinor: amountMinorSchema,
  currency: z.string().length(3),
  status: projectStatusSchema,
  createdByPersonId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  /**
   * FR-STW-08's own acceptance criterion: "shows total pledged, total
   * received, and progress against a stated target" - previously flagged
   * in `STEWARDSHIP_DESIGN_NOTES.md` as a near-term follow-up, now closed.
   * `totalPledgedMinor` sums every Pledge's own `pledgedAmountMinor`
   * regardless of fulfillment state; `totalReceivedMinor` sums only the
   * fulfilled ones ([INFERRED] using each Pledge's own pledged amount, not
   * its linked FinancialTransaction's actual amount - this schema has no
   * partial-payment tracking, only a fulfilled/not-fulfilled link, so
   * "received" here means "fulfilled," not a possibly-different actual
   * transaction total). `progressPercent` is `null` when
   * `targetAmountMinor` is `0` (nothing to divide by), otherwise
   * `totalReceivedMinor / targetAmountMinor * 100`, rounded, uncapped
   * (a Project can be over-funded).
   */
  totalPledgedMinor: amountMinorSchema,
  totalReceivedMinor: amountMinorSchema,
  progressPercent: z.number().nullable(),
});
export type ProjectResponseDto = z.infer<typeof projectResponseSchema>;

/**
 * FR-STW-08/H2: a Pledge is the *commitment*; `fulfillPledgeSchema` links
 * it to an already-`recordFinancialTransactionSchema`-recorded payment via
 * `fulfilledTransactionId` - see `recordFinancialTransactionSchema`'s doc
 * comment. `reminderOptIn` mirrors OQ-07's resolution ("a single, opt-in,
 * gentle notice... never a repeated or pressuring sequence") - this
 * milestone accepts the opt-in flag but does not build the reminder
 * delivery itself (no scheduler exists in this codebase - see
 * `STEWARDSHIP_DESIGN_NOTES.md`).
 */
export const createPledgeSchema = z.object({
  projectId: z.string().uuid(),
  pledgedAmountMinor: amountMinorSchema,
  currency: currencySchema.optional(),
  reminderOptIn: z.boolean().default(false),
});
export type CreatePledgeInput = z.infer<typeof createPledgeSchema>;

export const fulfillPledgeSchema = z.object({
  fulfilledTransactionId: z.string().uuid(),
});
export type FulfillPledgeInput = z.infer<typeof fulfillPledgeSchema>;

export const pledgeResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  projectId: z.string().uuid(),
  personId: z.string().uuid(),
  pledgedAmountMinor: amountMinorSchema,
  currency: z.string().length(3),
  pledgedAt: z.string().datetime(),
  reminderOptIn: z.boolean(),
  reminderSentAt: z.string().datetime().nullable(),
  fulfilledTransactionId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PledgeResponseDto = z.infer<typeof pledgeResponseSchema>;

/**
 * FR-STW-07's bank-deposit comparison half - previously flagged in
 * `STEWARDSHIP_DESIGN_NOTES.md` as "needs a schema addition, not an
 * application-layer guess." `weekStartDate` is a date-only string (the
 * Monday a week begins, [INFERRED] - no PRD section pins a week-boundary
 * convention), matching `dateOfBirth`'s own `z.string().date()` precedent
 * in `people.schemas.ts` rather than a full datetime.
 */
export const confirmBankDepositSchema = z.object({
  groupId: z.string().uuid(),
  weekStartDate: z.string().date(),
  depositedAmountMinor: amountMinorSchema,
  currency: currencySchema.optional(),
  bankReference: z.string().trim().min(1).optional(),
});
export type ConfirmBankDepositInput = z.infer<typeof confirmBankDepositSchema>;

export const bankDepositConfirmationResponseSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  groupId: z.string().uuid(),
  weekStartDate: z.string().date(),
  depositedAmountMinor: amountMinorSchema,
  currency: z.string().length(3),
  bankReference: z.string().nullable(),
  confirmedByPersonId: z.string().uuid(),
  createdAt: z.string().datetime(),
});
export type BankDepositConfirmationResponseDto = z.infer<typeof bankDepositConfirmationResponseSchema>;

/**
 * FR-STW-07's own acceptance criterion: "showing, per Bacenta, total
 * verified offerings against the corresponding bank deposit confirmation."
 * One row per Bacenta that has *either* a Verified-or-later inbound
 * transaction *or* a bank deposit confirmation in the requested week - a
 * Bacenta with neither has nothing to reconcile, so it's omitted rather
 * than padded in with zeros. `depositedAmountMinor`/`bankReference` are
 * `null` when no confirmation has been recorded yet for that Bacenta/week;
 * `matched` is `true` only when a confirmation exists and its amount
 * equals the verified total exactly.
 */
export const reconciliationRowSchema = z.object({
  groupId: z.string().uuid(),
  verifiedTotalMinor: amountMinorSchema,
  depositedAmountMinor: amountMinorSchema.nullable(),
  bankReference: z.string().nullable(),
  matched: z.boolean(),
});
export type ReconciliationRowDto = z.infer<typeof reconciliationRowSchema>;

export const weeklyReconciliationResponseSchema = z.object({
  branchId: z.string().uuid(),
  weekStartDate: z.string().date(),
  rows: z.array(reconciliationRowSchema),
});
export type WeeklyReconciliationResponseDto = z.infer<typeof weeklyReconciliationResponseSchema>;

/**
 * `[Milestone A: Financial + Gathering Backend Foundation]` `GET
 * /financial-transactions/summary` - the generalized, date-range-agnostic
 * successor to the Bank Deposit Reconciliation flow's own narrow
 * per-week/per-group query, exposed as its own read model rather than a
 * `groupBy` flag layered onto `GET /financial-transactions` (which stays
 * committed to returning raw `financialTransactionResponseSchema[]` rows,
 * never an aggregate). `EXPENSE` excluded from `type`, same reasoning as
 * `recordFinancialTransactionSchema`/`listFinancialTransactionsQuerySchema`.
 * `groupBy` defaults to `'none'` when omitted (service-layer default, not
 * this schema's).
 */
export const financialTransactionSummaryQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  type: financialTransactionTypeSchema.exclude(['EXPENSE']).optional(),
  groupBy: z.enum(['none', 'group']).optional(),
});
export type FinancialTransactionSummaryQuery = z.infer<typeof financialTransactionSummaryQuerySchema>;

/**
 * One row per Group for `groupBy=group`; exactly one row with
 * `sourceGroupId: null` (the whole branch, treated as a single implicit
 * group) for `groupBy=none` - a single consistent response shape for both
 * cases rather than a union type, so every client handles one shape.
 */
export const financialTransactionSummaryRowSchema = z.object({
  sourceGroupId: z.string().uuid().nullable(),
  totalAmountMinor: amountMinorSchema,
});
export type FinancialTransactionSummaryRowDto = z.infer<typeof financialTransactionSummaryRowSchema>;

export const financialTransactionSummaryResponseSchema = z.object({
  branchId: z.string().uuid(),
  from: z.string().datetime(),
  to: z.string().datetime(),
  type: financialTransactionTypeSchema.nullable(),
  groupBy: z.enum(['none', 'group']),
  rows: z.array(financialTransactionSummaryRowSchema),
});
export type FinancialTransactionSummaryResponseDto = z.infer<typeof financialTransactionSummaryResponseSchema>;
