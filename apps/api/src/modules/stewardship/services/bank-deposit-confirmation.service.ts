import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  BankDepositConfirmationResponseDto,
  ConfirmBankDepositInput,
  ReconciliationRowDto,
  WeeklyReconciliationResponseDto,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { BankDepositConfirmation } from '@prisma/client';

import { BankDepositConfirmationRepository } from '../repositories/bank-deposit-confirmation.repository';
import { FinancialTransactionRepository } from '../repositories/financial-transaction.repository';

const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function toDateOnlyString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Throws on a malformed `weekStartDate` rather than letting an invalid
 * `Date` silently propagate into a query - both the confirm and
 * reconciliation-read paths parse a date-only string from client input. */
function parseWeekStartDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`weekStartDate '${value}' is not a valid date`);
  }
  return parsed;
}

function toResponseDto(confirmation: BankDepositConfirmation): BankDepositConfirmationResponseDto {
  return {
    id: confirmation.id,
    branchId: confirmation.branchId,
    groupId: confirmation.groupId,
    weekStartDate: toDateOnlyString(confirmation.weekStartDate),
    depositedAmountMinor: confirmation.depositedAmountMinor.toString(),
    currency: confirmation.currency,
    bankReference: confirmation.bankReference,
    confirmedByPersonId: confirmation.confirmedByPersonId,
    createdAt: confirmation.createdAt.toISOString(),
  };
}

/**
 * FR-STW-07's bank-deposit comparison half: recording a Treasurer's
 * physical-slip confirmation, and generating the weekly reconciliation
 * view comparing it against Verified transaction totals. See
 * `STEWARDSHIP_DESIGN_NOTES.md` and `db/schema.prisma`'s
 * `BankDepositConfirmation` model doc comment for the full design.
 */
@Injectable()
export class BankDepositConfirmationService {
  constructor(
    private readonly bankDepositConfirmationRepository: BankDepositConfirmationRepository,
    private readonly financialTransactionRepository: FinancialTransactionRepository,
  ) {}

  async confirm(actor: ActorContext, input: ConfirmBankDepositInput): Promise<BankDepositConfirmationResponseDto> {
    const confirmation = await this.bankDepositConfirmationRepository.create({
      branchId: actor.branchId,
      groupId: input.groupId,
      weekStartDate: parseWeekStartDate(input.weekStartDate),
      depositedAmountMinor: BigInt(input.depositedAmountMinor),
      currency: input.currency ?? 'GHS',
      bankReference: input.bankReference,
      confirmedByPersonId: actor.personId,
    });
    return toResponseDto(confirmation);
  }

  /**
   * FR-STW-07's own acceptance criterion: "per Bacenta, total verified
   * offerings against the corresponding bank deposit confirmation." Merges
   * two independent queries (this Branch's Verified-transaction totals per
   * Bacenta for the week, and this Branch's confirmations for the same
   * week) rather than a single joined query - `FinancialTransaction` and
   * `BankDepositConfirmation` have no direct relation to each other (only
   * a shared `groupId`+week), so a join would need to be simulated in SQL
   * anyway; two `Promise.all`-parallel queries plus an in-memory merge is
   * simpler and equally correct at this data volume (one Branch's one
   * week of Bacentas).
   */
  async getWeeklyReconciliation(actor: ActorContext, weekStartDateInput: string): Promise<WeeklyReconciliationResponseDto> {
    const weekStartDate = parseWeekStartDate(weekStartDateInput);
    const weekEndDate = new Date(weekStartDate.getTime() + MILLISECONDS_PER_WEEK);

    const [verifiedTotals, confirmations] = await Promise.all([
      this.financialTransactionRepository.sumVerifiedAmountByGroupForRange(actor.branchId, weekStartDate, weekEndDate),
      this.bankDepositConfirmationRepository.findManyByBranchAndWeek(actor.branchId, weekStartDate),
    ]);

    const confirmationByGroup = new Map(confirmations.map((confirmation) => [confirmation.groupId, confirmation]));
    const groupIds = new Set<string>([
      ...verifiedTotals.map((total) => total.sourceGroupId),
      ...confirmations.map((confirmation) => confirmation.groupId),
    ]);

    const rows: ReconciliationRowDto[] = Array.from(groupIds).map((groupId) => {
      const verifiedTotalMinor = verifiedTotals.find((total) => total.sourceGroupId === groupId)?.totalAmountMinor ?? 0n;
      const confirmation = confirmationByGroup.get(groupId);
      const depositedAmountMinor = confirmation?.depositedAmountMinor ?? null;
      return {
        groupId,
        verifiedTotalMinor: verifiedTotalMinor.toString(),
        depositedAmountMinor: depositedAmountMinor === null ? null : depositedAmountMinor.toString(),
        bankReference: confirmation?.bankReference ?? null,
        matched: depositedAmountMinor !== null && verifiedTotalMinor === depositedAmountMinor,
      };
    });

    return { branchId: actor.branchId, weekStartDate: weekStartDateInput, rows };
  }
}
