import { z } from 'zod';
export declare const FINANCIAL_TRANSACTION_TYPE_VALUES: readonly ["OFFERING", "TITHE", "SPECIAL_OFFERING", "PLEDGE", "DONATION", "EXPENSE"];
export declare const financialTransactionTypeSchema: z.ZodEnum<["OFFERING", "TITHE", "SPECIAL_OFFERING", "PLEDGE", "DONATION", "EXPENSE"]>;
export type FinancialTransactionTypeDto = z.infer<typeof financialTransactionTypeSchema>;
export declare const FINANCIAL_TRANSACTION_CHANNEL_VALUES: readonly ["CASH", "MOBILE_MONEY"];
export declare const financialTransactionChannelSchema: z.ZodEnum<["CASH", "MOBILE_MONEY"]>;
export type FinancialTransactionChannelDto = z.infer<typeof financialTransactionChannelSchema>;
export declare const INBOUND_TRANSACTION_STATE_VALUES: readonly ["RECORDED", "VERIFIED", "FLAGGED", "UNDER_INVESTIGATION", "RECONCILED"];
export declare const inboundTransactionStateSchema: z.ZodEnum<["RECORDED", "VERIFIED", "FLAGGED", "UNDER_INVESTIGATION", "RECONCILED"]>;
export type InboundTransactionStateDto = z.infer<typeof inboundTransactionStateSchema>;
export declare const OUTBOUND_TRANSACTION_STATE_VALUES: readonly ["REQUESTED", "APPROVED", "REJECTED", "PAID", "RECEIPT_RETAINED"];
export declare const outboundTransactionStateSchema: z.ZodEnum<["REQUESTED", "APPROVED", "REJECTED", "PAID", "RECEIPT_RETAINED"]>;
export type OutboundTransactionStateDto = z.infer<typeof outboundTransactionStateSchema>;
export declare const PROJECT_STATUS_VALUES: readonly ["ACTIVE", "COMPLETED", "CANCELLED"];
export declare const projectStatusSchema: z.ZodEnum<["ACTIVE", "COMPLETED", "CANCELLED"]>;
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
export declare const recordFinancialTransactionSchema: z.ZodObject<{
    type: z.ZodEnum<["OFFERING", "TITHE", "SPECIAL_OFFERING", "PLEDGE", "DONATION"]>;
    sourceGroupId: z.ZodOptional<z.ZodString>;
    channel: z.ZodEnum<["CASH", "MOBILE_MONEY"]>;
    amountMinor: z.ZodString;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "OFFERING" | "TITHE" | "SPECIAL_OFFERING" | "PLEDGE" | "DONATION";
    channel: "CASH" | "MOBILE_MONEY";
    amountMinor: string;
    sourceGroupId?: string | undefined;
    currency?: string | undefined;
}, {
    type: "OFFERING" | "TITHE" | "SPECIAL_OFFERING" | "PLEDGE" | "DONATION";
    channel: "CASH" | "MOBILE_MONEY";
    amountMinor: string;
    sourceGroupId?: string | undefined;
    currency?: string | undefined;
}>;
export type RecordFinancialTransactionInput = z.infer<typeof recordFinancialTransactionSchema>;
/** FR-STW-04: "mark a transaction Flagged with a reason." */
export declare const flagFinancialTransactionSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type FlagFinancialTransactionInput = z.infer<typeof flagFinancialTransactionSchema>;
export declare const financialTransactionResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    type: z.ZodEnum<["OFFERING", "TITHE", "SPECIAL_OFFERING", "PLEDGE", "DONATION", "EXPENSE"]>;
    sourceGroupId: z.ZodNullable<z.ZodString>;
    giverPersonId: z.ZodNullable<z.ZodString>;
    channel: z.ZodNullable<z.ZodEnum<["CASH", "MOBILE_MONEY"]>>;
    amountMinor: z.ZodString;
    currency: z.ZodString;
    currentState: z.ZodString;
    /** [INFERRED] Resolved by the service from the `RECORDED` event's
     * `actorUserId` -> `Person.id` (Blueprint §9.4 / PRD §17.4's
     * `DIFFERENT_ACTOR_THAN_RECORDER` record-level check needs this same
     * fact at the guard layer; surfacing it on the response DTO too lets a
     * verification-queue UI show who recorded each entry). `null` only in
     * the theoretical case no `RECORDED` event exists for this transaction,
     * which the service never itself produces. */
    recordedByPersonId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "OFFERING" | "TITHE" | "SPECIAL_OFFERING" | "PLEDGE" | "DONATION" | "EXPENSE";
    id: string;
    branchId: string;
    createdAt: string;
    recordedByPersonId: string | null;
    sourceGroupId: string | null;
    channel: "CASH" | "MOBILE_MONEY" | null;
    amountMinor: string;
    currency: string;
    giverPersonId: string | null;
    currentState: string;
}, {
    type: "OFFERING" | "TITHE" | "SPECIAL_OFFERING" | "PLEDGE" | "DONATION" | "EXPENSE";
    id: string;
    branchId: string;
    createdAt: string;
    recordedByPersonId: string | null;
    sourceGroupId: string | null;
    channel: "CASH" | "MOBILE_MONEY" | null;
    amountMinor: string;
    currency: string;
    giverPersonId: string | null;
    currentState: string;
}>;
export type FinancialTransactionResponseDto = z.infer<typeof financialTransactionResponseSchema>;
/**
 * FR-STW-09: expense request/approve/reject/pay/receipt. Modeled as a 1:1
 * extension of `FinancialTransaction` (`type=EXPENSE`) per
 * `db/DESIGN_NOTES.md` Open Question #5.
 */
export declare const requestExpenseSchema: z.ZodObject<{
    amountMinor: z.ZodString;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    description: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    amountMinor: string;
    description: string;
    category?: string | undefined;
    currency?: string | undefined;
}, {
    amountMinor: string;
    description: string;
    category?: string | undefined;
    currency?: string | undefined;
}>;
export type RequestExpenseInput = z.infer<typeof requestExpenseSchema>;
/** FR-STW-09: rejection requires a reason, matching
 * `flagFinancialTransactionSchema`'s own shape - both are a designated
 * reviewer explaining a non-default outcome. */
export declare const rejectExpenseSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
/** BR-STW-08: "receipts are retained for all expenses" -
 * `receiptStorageKey` mirrors `Expense.receiptStorageKey`'s own naming;
 * this milestone does not implement the file upload itself (out of scope
 * for an application-layer/API milestone - see
 * `STEWARDSHIP_DESIGN_NOTES.md`), only recording the storage key of an
 * already-uploaded receipt. */
export declare const attachExpenseReceiptSchema: z.ZodObject<{
    receiptStorageKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    receiptStorageKey: string;
}, {
    receiptStorageKey: string;
}>;
export type AttachExpenseReceiptInput = z.infer<typeof attachExpenseReceiptSchema>;
export declare const expenseResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    transactionId: z.ZodString;
    requestedByPersonId: z.ZodString;
    description: z.ZodString;
    category: z.ZodNullable<z.ZodString>;
    receiptStorageKey: z.ZodNullable<z.ZodString>;
    approvedByPersonId: z.ZodNullable<z.ZodString>;
    approvedAt: z.ZodNullable<z.ZodString>;
    amountMinor: z.ZodString;
    currency: z.ZodString;
    currentState: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    category: string | null;
    amountMinor: string;
    currency: string;
    currentState: string;
    description: string;
    receiptStorageKey: string | null;
    transactionId: string;
    requestedByPersonId: string;
    approvedByPersonId: string | null;
    approvedAt: string | null;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    category: string | null;
    amountMinor: string;
    currency: string;
    currentState: string;
    description: string;
    receiptStorageKey: string | null;
    transactionId: string;
    requestedByPersonId: string;
    approvedByPersonId: string | null;
    approvedAt: string | null;
}>;
export type ExpenseResponseDto = z.infer<typeof expenseResponseSchema>;
/** FR-STW-08/H2: Project entities against which Pledges are tracked. */
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    targetAmountMinor: z.ZodString;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    targetAmountMinor: string;
    currency?: string | undefined;
    description?: string | undefined;
}, {
    name: string;
    targetAmountMinor: string;
    currency?: string | undefined;
    description?: string | undefined;
}>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export declare const projectResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    targetAmountMinor: z.ZodString;
    currency: z.ZodString;
    status: z.ZodEnum<["ACTIVE", "COMPLETED", "CANCELLED"]>;
    createdByPersonId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
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
    totalPledgedMinor: z.ZodString;
    totalReceivedMinor: z.ZodString;
    progressPercent: z.ZodNullable<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "CANCELLED" | "COMPLETED";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    createdByPersonId: string;
    currency: string;
    description: string | null;
    targetAmountMinor: string;
    totalPledgedMinor: string;
    totalReceivedMinor: string;
    progressPercent: number | null;
}, {
    status: "ACTIVE" | "CANCELLED" | "COMPLETED";
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    name: string;
    createdByPersonId: string;
    currency: string;
    description: string | null;
    targetAmountMinor: string;
    totalPledgedMinor: string;
    totalReceivedMinor: string;
    progressPercent: number | null;
}>;
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
export declare const createPledgeSchema: z.ZodObject<{
    projectId: z.ZodString;
    pledgedAmountMinor: z.ZodString;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    reminderOptIn: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    pledgedAmountMinor: string;
    reminderOptIn: boolean;
    currency?: string | undefined;
}, {
    projectId: string;
    pledgedAmountMinor: string;
    currency?: string | undefined;
    reminderOptIn?: boolean | undefined;
}>;
export type CreatePledgeInput = z.infer<typeof createPledgeSchema>;
export declare const fulfillPledgeSchema: z.ZodObject<{
    fulfilledTransactionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    fulfilledTransactionId: string;
}, {
    fulfilledTransactionId: string;
}>;
export type FulfillPledgeInput = z.infer<typeof fulfillPledgeSchema>;
export declare const pledgeResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    projectId: z.ZodString;
    personId: z.ZodString;
    pledgedAmountMinor: z.ZodString;
    currency: z.ZodString;
    pledgedAt: z.ZodString;
    reminderOptIn: z.ZodBoolean;
    reminderSentAt: z.ZodNullable<z.ZodString>;
    fulfilledTransactionId: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    personId: string;
    currency: string;
    projectId: string;
    pledgedAmountMinor: string;
    reminderOptIn: boolean;
    fulfilledTransactionId: string | null;
    pledgedAt: string;
    reminderSentAt: string | null;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
    personId: string;
    currency: string;
    projectId: string;
    pledgedAmountMinor: string;
    reminderOptIn: boolean;
    fulfilledTransactionId: string | null;
    pledgedAt: string;
    reminderSentAt: string | null;
}>;
export type PledgeResponseDto = z.infer<typeof pledgeResponseSchema>;
/**
 * FR-STW-07's bank-deposit comparison half - previously flagged in
 * `STEWARDSHIP_DESIGN_NOTES.md` as "needs a schema addition, not an
 * application-layer guess." `weekStartDate` is a date-only string (the
 * Monday a week begins, [INFERRED] - no PRD section pins a week-boundary
 * convention), matching `dateOfBirth`'s own `z.string().date()` precedent
 * in `people.schemas.ts` rather than a full datetime.
 */
export declare const confirmBankDepositSchema: z.ZodObject<{
    groupId: z.ZodString;
    weekStartDate: z.ZodString;
    depositedAmountMinor: z.ZodString;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    bankReference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    weekStartDate: string;
    depositedAmountMinor: string;
    currency?: string | undefined;
    bankReference?: string | undefined;
}, {
    groupId: string;
    weekStartDate: string;
    depositedAmountMinor: string;
    currency?: string | undefined;
    bankReference?: string | undefined;
}>;
export type ConfirmBankDepositInput = z.infer<typeof confirmBankDepositSchema>;
export declare const bankDepositConfirmationResponseSchema: z.ZodObject<{
    id: z.ZodString;
    branchId: z.ZodString;
    groupId: z.ZodString;
    weekStartDate: z.ZodString;
    depositedAmountMinor: z.ZodString;
    currency: z.ZodString;
    bankReference: z.ZodNullable<z.ZodString>;
    confirmedByPersonId: z.ZodString;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    branchId: string;
    createdAt: string;
    groupId: string;
    currency: string;
    weekStartDate: string;
    depositedAmountMinor: string;
    bankReference: string | null;
    confirmedByPersonId: string;
}, {
    id: string;
    branchId: string;
    createdAt: string;
    groupId: string;
    currency: string;
    weekStartDate: string;
    depositedAmountMinor: string;
    bankReference: string | null;
    confirmedByPersonId: string;
}>;
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
export declare const reconciliationRowSchema: z.ZodObject<{
    groupId: z.ZodString;
    verifiedTotalMinor: z.ZodString;
    depositedAmountMinor: z.ZodNullable<z.ZodString>;
    bankReference: z.ZodNullable<z.ZodString>;
    matched: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    depositedAmountMinor: string | null;
    bankReference: string | null;
    verifiedTotalMinor: string;
    matched: boolean;
}, {
    groupId: string;
    depositedAmountMinor: string | null;
    bankReference: string | null;
    verifiedTotalMinor: string;
    matched: boolean;
}>;
export type ReconciliationRowDto = z.infer<typeof reconciliationRowSchema>;
export declare const weeklyReconciliationResponseSchema: z.ZodObject<{
    branchId: z.ZodString;
    weekStartDate: z.ZodString;
    rows: z.ZodArray<z.ZodObject<{
        groupId: z.ZodString;
        verifiedTotalMinor: z.ZodString;
        depositedAmountMinor: z.ZodNullable<z.ZodString>;
        bankReference: z.ZodNullable<z.ZodString>;
        matched: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        groupId: string;
        depositedAmountMinor: string | null;
        bankReference: string | null;
        verifiedTotalMinor: string;
        matched: boolean;
    }, {
        groupId: string;
        depositedAmountMinor: string | null;
        bankReference: string | null;
        verifiedTotalMinor: string;
        matched: boolean;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    branchId: string;
    weekStartDate: string;
    rows: {
        groupId: string;
        depositedAmountMinor: string | null;
        bankReference: string | null;
        verifiedTotalMinor: string;
        matched: boolean;
    }[];
}, {
    branchId: string;
    weekStartDate: string;
    rows: {
        groupId: string;
        depositedAmountMinor: string | null;
        bankReference: string | null;
        verifiedTotalMinor: string;
        matched: boolean;
    }[];
}>;
export type WeeklyReconciliationResponseDto = z.infer<typeof weeklyReconciliationResponseSchema>;
//# sourceMappingURL=stewardship.schemas.d.ts.map