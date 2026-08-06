import type {
  ExpenseResponseDto,
  FinancialTransactionChannelDto,
  FinancialTransactionResponseDto,
  FinancialTransactionTypeDto,
  FlagFinancialTransactionInput,
  RecordFinancialTransactionInput,
  RejectExpenseInput,
  RequestExpenseInput,
} from '@ecclesia/contracts';

import { apiGet, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `GET /financial-transactions` (Stewardship Web Admin sprint's
 * verification queue - PRD §16.5's "Financial Transaction verification
 * queue"). Unlike every other domain page's `resolveDefaultXQuery(actor)`
 * pure function, no such resolver exists here: `FinancialTransactionListResourceContextGuard`
 * always resolves `{ branchId: actor.branchId }` regardless of role (see
 * that guard's own doc comment) - there is no groupId/CLUSTER parameter
 * for a query-builder to derive from a role. The `state` filter alone is
 * client-controlled (a plain optional string, mirroring the endpoint's own
 * unvalidated `@Query('state')`). Which roles can actually see data back
 * (RESIDENT_PASTOR/TREASURER - see `STEWARDSHIP_PAGE_DESIGN_NOTES.md` §2)
 * is left to the backend's RBAC 403, the same "don't pre-empt the
 * backend" precedent Gatherings' ASSISTANT_PASTOR/BASONTA_LEADER gap
 * already established.
 */
export function useTransactionQueue(accessToken: string | undefined, state?: string): AsyncDataResult<FinancialTransactionResponseDto[]> {
  return useAsyncData<FinancialTransactionResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const qs = state ? `?state=${encodeURIComponent(state)}` : '';
      return apiGet<FinancialTransactionResponseDto[]>(`/financial-transactions${qs}`, { authToken: accessToken, signal });
    },
    [accessToken, state],
  );
}

/** `POST /financial-transactions/:id/verify` (FR-STW-04, RECORDED ->
 * VERIFIED). No request body - mirrors `completeFollowUpTask`'s own
 * no-payload shape, just over `apiPost` instead of `apiPatch` since this
 * controller uses `POST` for its transition endpoints. */
export function verifyTransaction(accessToken: string, id: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${id}/verify`, {}, { authToken: accessToken });
}

/** `POST /financial-transactions/:id/flag` (FR-STW-04, RECORDED ->
 * FLAGGED, mandatory reason). */
export function flagTransaction(
  accessToken: string,
  id: string,
  input: FlagFinancialTransactionInput,
): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${id}/flag`, input, { authToken: accessToken });
}

/** `POST /financial-transactions/:id/escalate` (FLAGGED -> UNDER_INVESTIGATION). */
export function escalateTransaction(accessToken: string, id: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${id}/escalate`, {}, { authToken: accessToken });
}

/** `POST /financial-transactions/:id/reconcile` (VERIFIED -> RECONCILED). */
export function reconcileTransaction(accessToken: string, id: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${id}/reconcile`, {}, { authToken: accessToken });
}

/** `GET /expenses` (Stewardship Web Admin sprint's Expense approval
 * queue - the endpoint this sprint's backend gap-filling step added). See
 * `useTransactionQueue`'s own doc comment - the identical "no
 * resolveDefaultQuery, backend 403 decides visibility" reasoning applies,
 * since `ExpenseListResourceContextGuard` also always resolves
 * `{ branchId: actor.branchId }`. */
export function useExpenseQueue(accessToken: string | undefined, state?: string): AsyncDataResult<ExpenseResponseDto[]> {
  return useAsyncData<ExpenseResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const qs = state ? `?state=${encodeURIComponent(state)}` : '';
      return apiGet<ExpenseResponseDto[]>(`/expenses${qs}`, { authToken: accessToken, signal });
    },
    [accessToken, state],
  );
}

/** `POST /expenses/:id/approve` (FR-STW-09, REQUESTED -> APPROVED). */
export function approveExpense(accessToken: string, id: string): Promise<ExpenseResponseDto> {
  return apiPost<ExpenseResponseDto>(`/expenses/${id}/approve`, {}, { authToken: accessToken });
}

/** `POST /expenses/:id/reject` (FR-STW-09, REQUESTED -> REJECTED, mandatory reason). */
export function rejectExpense(accessToken: string, id: string, input: RejectExpenseInput): Promise<ExpenseResponseDto> {
  return apiPost<ExpenseResponseDto>(`/expenses/${id}/reject`, input, { authToken: accessToken });
}

/** `POST /expenses/:id/pay` (APPROVED -> PAID). */
export function payExpense(accessToken: string, id: string): Promise<ExpenseResponseDto> {
  return apiPost<ExpenseResponseDto>(`/expenses/${id}/pay`, {}, { authToken: accessToken });
}

/**
 * `POST /financial-transactions` (`recordFinancialTransactionSchema`) -
 * the create-shaped endpoint `STEWARDSHIP_PAGE_DESIGN_NOTES.md` §4
 * originally deferred pending a Group picker that turned out not to be
 * buildable *or* necessary: `GET /groups` has no `search` parameter, and
 * `BACENTA_LEADER` can't call it at all (`GroupListResourceContextGuard`
 * only ever resolves a Branch-wide resource, denying every role but
 * `RESIDENT_PASTOR`/`ADMIN`). The only role that ever needs
 * `sourceGroupId` (`BACENTA_LEADER`, `OWN_GROUP` scope - `TREASURER`/
 * `MEMBER` hold `SELF` and must omit it entirely, see the schema's own
 * doc comment) already knows their own Bacenta's id from `GET /auth/me`'s
 * `bacentaId` field - the exact same "no search needed, the actor already
 * knows their own group" shape `apps/mobile`'s Offering Recording screen
 * uses via `session.bacentaGroupId`. `StewardshipPage` derives
 * `sourceGroupId` from `state.actor.bacentaId` accordingly, not a picker.
 */
export function recordTransaction(accessToken: string, input: RecordFinancialTransactionInput): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>('/financial-transactions', input, { authToken: accessToken });
}

/** All five types `recordFinancialTransactionSchema` accepts (every
 * `FinancialTransactionTypeDto` value except `EXPENSE`, which is
 * `requestExpenseSchema`'s own separate flow below) - unlike
 * `apps/mobile`'s Offering Recording screen (Bacenta-Shepherd-scoped,
 * intentionally limited to Offering/Tithe/Special Offering), this page is
 * the general Stewardship surface every eligible role uses, including a
 * `TREASURER`/`MEMBER` recording a personal Pledge payment or Donation
 * (PRD §13.5's "a Pledge's payment is recorded through this same inbound
 * flow" reuse the schema's own doc comment names) - so all five are
 * offered here. */
export const RECORD_TRANSACTION_TYPE_OPTIONS: { value: Exclude<FinancialTransactionTypeDto, 'EXPENSE'>; label: string }[] = [
  { value: 'OFFERING', label: 'Offering' },
  { value: 'TITHE', label: 'Tithe' },
  { value: 'SPECIAL_OFFERING', label: 'Special Offering' },
  { value: 'PLEDGE', label: 'Pledge' },
  { value: 'DONATION', label: 'Donation' },
];

export const RECORD_TRANSACTION_CHANNEL_OPTIONS: { value: FinancialTransactionChannelDto; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

/** `POST /expenses` (`requestExpenseSchema`) - the other create-shaped
 * endpoint `STEWARDSHIP_PAGE_DESIGN_NOTES.md` §4 deferred, but genuinely
 * had no picker dependency at all per that note - just a plain form
 * (amount/currency/description/category). */
export function requestExpense(accessToken: string, input: RequestExpenseInput): Promise<ExpenseResponseDto> {
  return apiPost<ExpenseResponseDto>('/expenses', input, { authToken: accessToken });
}

/**
 * Converts a user-typed amount in major currency units (e.g. "50.5") into
 * the integer-minor-unit decimal string both `recordFinancialTransactionSchema`
 * and `requestExpenseSchema` require (`amountMinor`, e.g. "5050"). A
 * direct duplicate of `apps/mobile`'s own `parseAmountToMinorUnits`
 * (`OfferingRecording/hooks/useOfferingRecordingData.ts`) - the same
 * "small per-app glue, not worth extracting into a shared lib" precedent
 * already applied to `apiPost`/`apiPatch` and `ROLE_LABELS` elsewhere in
 * this codebase, not an oversight. Via string manipulation, never a JS
 * `number` multiplication, for the exact float-precision reason
 * `stewardship.schemas.ts`'s own doc comment gives for why `amountMinor`
 * is a decimal string on the wire at all. Returns `null` for anything
 * that isn't a positive amount with at most 2 decimal places.
 */
export function parseAmountToMinorUnits(raw: string): string | null {
  const trimmed = raw.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const [, wholePart, fractionPart = ''] = match;
  const paddedFraction = fractionPart.padEnd(2, '0');
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '');
  const minorUnits = `${normalizedWhole}${paddedFraction}`.replace(/^0+(?=\d)/, '');
  return minorUnits === '0' ? null : minorUnits;
}

/** `amountMinor` is a decimal string of minor currency units on the wire
 * (see `stewardship.schemas.ts`'s own doc comment on why - BigInt/JSON
 * round-tripping). Presentation-only conversion to major units for
 * display; never sent back to the API in this form. Assumes a 2-decimal
 * currency (true for GHS, the only currency this deployment uses per
 * `currencySchema`'s default) - a 0- or 3-decimal ISO 4217 currency would
 * need a currency-aware divisor, [Design Decision] not built since GHS is
 * the only value this codebase ever produces today. */
export function formatAmountMinor(amountMinor: string, currency: string): string {
  const major = Number(amountMinor) / 100;
  return `${currency} ${major.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
