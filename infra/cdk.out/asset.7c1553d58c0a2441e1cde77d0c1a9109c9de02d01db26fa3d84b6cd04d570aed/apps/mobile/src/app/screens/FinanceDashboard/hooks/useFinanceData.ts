import type {
  BankDepositConfirmationResponseDto,
  FinancialTransactionResponseDto,
  WeeklyReconciliationResponseDto,
} from '@ecclesia/contracts';

import { apiGet, apiPost } from '../../../lib/api-client';
import { useActorSession } from '../../../lib/session';
import { useAsyncData } from '../../ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../../ShepherdDashboard/hooks/useAsyncData';

/**
 * Finance Officer (`TREASURER`) data hooks - shared across all three
 * Finance Officer screens (Dashboard/Verify/Reconcile), the same
 * cross-screen reuse pattern `useMinistryData.ts`/
 * `useShepherdDashboardData.ts` already established. `TREASURER` is
 * `BRANCH`-scoped for every action here (`permission-matrix.ts`) - unlike
 * the Shepherd/Ministry Leader hooks, none of these need a group id, only
 * `session.authToken`, so `useActorSession()` (not a persona-specific
 * session hook) is all that's needed.
 */

/** The Verify queue (FR-STW-03/04): every inbound transaction still in
 * `RECORDED` state, awaiting a Treasurer's confirm/flag/escalate
 * decision. `GET /financial-transactions?state=RECORDED` - unmodified,
 * existing endpoint (`FinancialTransactionController.listByBranch`). */
export function useRecordedTransactions(): AsyncDataResult<FinancialTransactionResponseDto[]> {
  const session = useActorSession();
  return useAsyncData(
    (signal) => apiGet<FinancialTransactionResponseDto[]>('/financial-transactions?state=RECORDED', { authToken: session.authToken, signal }),
    [session.authToken],
  );
}

/** Verified-but-not-yet-reconciled transactions (FR-STW-05) - the
 * per-transaction half of the Reconcile tab. */
export function useVerifiedTransactions(): AsyncDataResult<FinancialTransactionResponseDto[]> {
  const session = useActorSession();
  return useAsyncData(
    (signal) => apiGet<FinancialTransactionResponseDto[]>('/financial-transactions?state=VERIFIED', { authToken: session.authToken, signal }),
    [session.authToken],
  );
}

export function verifyTransaction(authToken: string, transactionId: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${transactionId}/verify`, {}, { authToken });
}

export function flagTransaction(authToken: string, transactionId: string, reason: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${transactionId}/flag`, { reason }, { authToken });
}

export function escalateTransaction(authToken: string, transactionId: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${transactionId}/escalate`, {}, { authToken });
}

export function reconcileTransaction(authToken: string, transactionId: string): Promise<FinancialTransactionResponseDto> {
  return apiPost<FinancialTransactionResponseDto>(`/financial-transactions/${transactionId}/reconcile`, {}, { authToken });
}

/** This week's Monday, `YYYY-MM-DD` (date-only, matching
 * `confirmBankDepositSchema`'s own `weekStartDate` shape - see that
 * schema's doc comment for why it's a plain date, not a datetime). */
export function currentWeekStartDate(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

/** FR-STW-07's weekly reconciliation view: per-Bacenta verified totals
 * vs. confirmed bank deposits, for the current week. `weekStartDate` is
 * fixed to `currentWeekStartDate()` rather than user-navigable - a "browse
 * other weeks" affordance is a real, disclosed limitation this screen
 * carries (see `MOBILE_PERSONAS_DESIGN_NOTES.md`), not silently assumed
 * to be in scope; the brief names "Reconcile," not "Reconciliation
 * history." */
export function useWeeklyReconciliation(): AsyncDataResult<WeeklyReconciliationResponseDto> {
  const session = useActorSession();
  const weekStartDate = currentWeekStartDate();
  return useAsyncData(
    (signal) =>
      apiGet<WeeklyReconciliationResponseDto>(`/bank-deposit-confirmations/reconciliation?weekStartDate=${weekStartDate}`, {
        authToken: session.authToken,
        signal,
      }),
    [weekStartDate, session.authToken],
  );
}

export interface ConfirmBankDepositInput {
  groupId: string;
  depositedAmountMinor: string;
  bankReference?: string;
}

export function confirmBankDeposit(authToken: string, input: ConfirmBankDepositInput): Promise<BankDepositConfirmationResponseDto> {
  return apiPost<BankDepositConfirmationResponseDto>(
    '/bank-deposit-confirmations',
    { ...input, weekStartDate: currentWeekStartDate() },
    { authToken },
  );
}
