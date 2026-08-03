"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyReconciliationResponseSchema = exports.reconciliationRowSchema = exports.bankDepositConfirmationResponseSchema = exports.confirmBankDepositSchema = exports.pledgeResponseSchema = exports.fulfillPledgeSchema = exports.createPledgeSchema = exports.projectResponseSchema = exports.createProjectSchema = exports.expenseResponseSchema = exports.attachExpenseReceiptSchema = exports.rejectExpenseSchema = exports.requestExpenseSchema = exports.financialTransactionResponseSchema = exports.flagFinancialTransactionSchema = exports.recordFinancialTransactionSchema = exports.projectStatusSchema = exports.PROJECT_STATUS_VALUES = exports.outboundTransactionStateSchema = exports.OUTBOUND_TRANSACTION_STATE_VALUES = exports.inboundTransactionStateSchema = exports.INBOUND_TRANSACTION_STATE_VALUES = exports.financialTransactionChannelSchema = exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES = exports.financialTransactionTypeSchema = exports.FINANCIAL_TRANSACTION_TYPE_VALUES = void 0;
const zod_1 = require("zod");
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
const amountMinorSchema = zod_1.z
    .string()
    .regex(/^[0-9]+$/, 'amountMinor must be a non-negative integer string of minor currency units');
/// [PRD-DERIVED] NFR-L10N-02: "Financial Transaction entities carry an
/// explicit currency field" - ISO 4217, defaulting to GHS per the
/// reference deployment.
const currencySchema = zod_1.z.string().length(3).default('GHS');
exports.FINANCIAL_TRANSACTION_TYPE_VALUES = ['OFFERING', 'TITHE', 'SPECIAL_OFFERING', 'PLEDGE', 'DONATION', 'EXPENSE'];
exports.financialTransactionTypeSchema = zod_1.z.enum(exports.FINANCIAL_TRANSACTION_TYPE_VALUES);
exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES = ['CASH', 'MOBILE_MONEY'];
exports.financialTransactionChannelSchema = zod_1.z.enum(exports.FINANCIAL_TRANSACTION_CHANNEL_VALUES);
exports.INBOUND_TRANSACTION_STATE_VALUES = ['RECORDED', 'VERIFIED', 'FLAGGED', 'UNDER_INVESTIGATION', 'RECONCILED'];
exports.inboundTransactionStateSchema = zod_1.z.enum(exports.INBOUND_TRANSACTION_STATE_VALUES);
exports.OUTBOUND_TRANSACTION_STATE_VALUES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PAID', 'RECEIPT_RETAINED'];
exports.outboundTransactionStateSchema = zod_1.z.enum(exports.OUTBOUND_TRANSACTION_STATE_VALUES);
exports.PROJECT_STATUS_VALUES = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
exports.projectStatusSchema = zod_1.z.enum(exports.PROJECT_STATUS_VALUES);
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
exports.recordFinancialTransactionSchema = zod_1.z.object({
    type: exports.financialTransactionTypeSchema.exclude(['EXPENSE']),
    sourceGroupId: zod_1.z.string().uuid().optional(),
    channel: exports.financialTransactionChannelSchema,
    amountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
});
/** FR-STW-04: "mark a transaction Flagged with a reason." */
exports.flagFinancialTransactionSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, 'reason is required'),
});
exports.financialTransactionResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    type: exports.financialTransactionTypeSchema,
    sourceGroupId: zod_1.z.string().uuid().nullable(),
    giverPersonId: zod_1.z.string().uuid().nullable(),
    channel: exports.financialTransactionChannelSchema.nullable(),
    amountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    currentState: zod_1.z.string(),
    /** [INFERRED] Resolved by the service from the `RECORDED` event's
     * `actorUserId` -> `Person.id` (Blueprint §9.4 / PRD §17.4's
     * `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs this same
     * fact at the guard layer; surfacing it on the response DTO too lets a
     * verification-queue UI show who recorded each entry). `null` only in
     * the theoretical case no `RECORDED` event exists for this transaction,
     * which the service never itself produces. */
    recordedByPersonId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string().datetime(),
});
/**
 * FR-STW-09: expense request/approve/reject/pay/receipt. Modeled as a 1:1
 * extension of `FinancialTransaction` (`type=EXPENSE`) per
 * `db/DESIGN_NOTES.md` Open Question #5.
 */
exports.requestExpenseSchema = zod_1.z.object({
    amountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
    description: zod_1.z.string().trim().min(1, 'description is required'),
    category: zod_1.z.string().trim().min(1).optional(),
});
/** FR-STW-09: rejection requires a reason, matching
 * `flagFinancialTransactionSchema`'s own shape - both are a designated
 * reviewer explaining a non-default outcome. */
exports.rejectExpenseSchema = zod_1.z.object({
    reason: zod_1.z.string().trim().min(1, 'reason is required'),
});
/** BR-STW-08: "receipts are retained for all expenses" -
 * `receiptStorageKey` mirrors `Expense.receiptStorageKey`'s own naming;
 * this milestone does not implement the file upload itself (out of scope
 * for an application-layer/API milestone - see
 * `STEWARDSHIP_DESIGN_NOTES.md`), only recording the storage key of an
 * already-uploaded receipt. */
exports.attachExpenseReceiptSchema = zod_1.z.object({
    receiptStorageKey: zod_1.z.string().trim().min(1, 'receiptStorageKey is required'),
});
exports.expenseResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    transactionId: zod_1.z.string().uuid(),
    requestedByPersonId: zod_1.z.string().uuid(),
    description: zod_1.z.string(),
    category: zod_1.z.string().nullable(),
    receiptStorageKey: zod_1.z.string().nullable(),
    approvedByPersonId: zod_1.z.string().uuid().nullable(),
    approvedAt: zod_1.z.string().datetime().nullable(),
    amountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    currentState: zod_1.z.string(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/** FR-STW-08/H2: Project entities against which Pledges are tracked. */
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, 'name is required'),
    description: zod_1.z.string().trim().min(1).optional(),
    targetAmountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
});
exports.projectResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    targetAmountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    status: exports.projectStatusSchema,
    createdByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
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
    progressPercent: zod_1.z.number().nullable(),
});
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
exports.createPledgeSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    pledgedAmountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
    reminderOptIn: zod_1.z.boolean().default(false),
});
exports.fulfillPledgeSchema = zod_1.z.object({
    fulfilledTransactionId: zod_1.z.string().uuid(),
});
exports.pledgeResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    personId: zod_1.z.string().uuid(),
    pledgedAmountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    pledgedAt: zod_1.z.string().datetime(),
    reminderOptIn: zod_1.z.boolean(),
    reminderSentAt: zod_1.z.string().datetime().nullable(),
    fulfilledTransactionId: zod_1.z.string().uuid().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
/**
 * FR-STW-07's bank-deposit comparison half - previously flagged in
 * `STEWARDSHIP_DESIGN_NOTES.md` as "needs a schema addition, not an
 * application-layer guess." `weekStartDate` is a date-only string (the
 * Monday a week begins, [INFERRED] - no PRD section pins a week-boundary
 * convention), matching `dateOfBirth`'s own `z.string().date()` precedent
 * in `people.schemas.ts` rather than a full datetime.
 */
exports.confirmBankDepositSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid(),
    weekStartDate: zod_1.z.string().date(),
    depositedAmountMinor: amountMinorSchema,
    currency: currencySchema.optional(),
    bankReference: zod_1.z.string().trim().min(1).optional(),
});
exports.bankDepositConfirmationResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    branchId: zod_1.z.string().uuid(),
    groupId: zod_1.z.string().uuid(),
    weekStartDate: zod_1.z.string().date(),
    depositedAmountMinor: amountMinorSchema,
    currency: zod_1.z.string().length(3),
    bankReference: zod_1.z.string().nullable(),
    confirmedByPersonId: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
});
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
exports.reconciliationRowSchema = zod_1.z.object({
    groupId: zod_1.z.string().uuid(),
    verifiedTotalMinor: amountMinorSchema,
    depositedAmountMinor: amountMinorSchema.nullable(),
    bankReference: zod_1.z.string().nullable(),
    matched: zod_1.z.boolean(),
});
exports.weeklyReconciliationResponseSchema = zod_1.z.object({
    branchId: zod_1.z.string().uuid(),
    weekStartDate: zod_1.z.string().date(),
    rows: zod_1.z.array(exports.reconciliationRowSchema),
});
//# sourceMappingURL=stewardship.schemas.js.map