import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { BankDepositConfirmation } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateBankDepositConfirmationRecord {
  branchId: string;
  groupId: string;
  weekStartDate: Date;
  depositedAmountMinor: bigint;
  currency: string;
  bankReference?: string;
  confirmedByPersonId: string;
}

/**
 * Prisma-backed persistence for `stewardship.bank_deposit_confirmations`
 * (FR-STW-07's bank-deposit comparison half - see
 * `db/schema.prisma`'s `BankDepositConfirmation` model doc comment and
 * `STEWARDSHIP_DESIGN_NOTES.md`).
 */
@Injectable()
export class BankDepositConfirmationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Throws `ConflictException` on the `@@unique([groupId, weekStartDate])`
   * constraint (Prisma error code `P2002`) - one confirmation per Bacenta
   * per week, matching `ProcessedEventRepository.tryRecord`'s own
   * "let the DB's own unique constraint be the single source of truth"
   * pattern, here surfaced as a thrown error rather than a boolean since
   * there is no legitimate "already recorded, no-op" case for a Treasurer
   * confirming a deposit twice - a genuine duplicate submission is a
   * client bug worth surfacing, not silently swallowing.
   */
  async create(input: CreateBankDepositConfirmationRecord): Promise<BankDepositConfirmation> {
    try {
      return await this.prisma.bankDepositConfirmation.create({
        data: {
          branchId: input.branchId,
          groupId: input.groupId,
          weekStartDate: input.weekStartDate,
          depositedAmountMinor: input.depositedAmountMinor,
          currency: input.currency,
          bankReference: input.bankReference,
          confirmedByPersonId: input.confirmedByPersonId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `A bank deposit confirmation already exists for group '${input.groupId}' for the week starting '${input.weekStartDate.toISOString().slice(0, 10)}'`,
        );
      }
      throw error;
    }
  }

  findByGroupAndWeek(groupId: string, weekStartDate: Date): Promise<BankDepositConfirmation | null> {
    return this.prisma.bankDepositConfirmation.findUnique({
      where: { groupId_weekStartDate: { groupId, weekStartDate } },
    });
  }

  findManyByBranchAndWeek(branchId: string, weekStartDate: Date): Promise<BankDepositConfirmation[]> {
    return this.prisma.bankDepositConfirmation.findMany({ where: { branchId, weekStartDate } });
  }
}
