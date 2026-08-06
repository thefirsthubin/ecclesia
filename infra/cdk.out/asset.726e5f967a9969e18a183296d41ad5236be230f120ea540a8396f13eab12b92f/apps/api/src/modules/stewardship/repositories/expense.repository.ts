import { Injectable } from '@nestjs/common';
import type { Expense } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateExpenseRecord {
  branchId: string;
  transactionId: string;
  requestedByPersonId: string;
  description: string;
  category?: string;
}

export interface UpdateExpenseRecord {
  approvedByPersonId?: string;
  approvedAt?: Date;
  receiptStorageKey?: string;
}

/**
 * Prisma-backed persistence for `stewardship.expenses` - the 1:1
 * extension-table half of an Expense (`db/DESIGN_NOTES.md` Open Question
 * #5); the shared state-machine half (`currentState`, the event log) is
 * `FinancialTransactionRepository`'s responsibility, not this one's.
 */
@Injectable()
export class ExpenseRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateExpenseRecord): Promise<Expense> {
    return this.prisma.expense.create({ data: input });
  }

  findById(id: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({ where: { id } });
  }

  findByTransactionId(transactionId: string): Promise<Expense | null> {
    return this.prisma.expense.findUnique({ where: { transactionId } });
  }

  update(id: string, input: UpdateExpenseRecord): Promise<Expense> {
    return this.prisma.expense.update({ where: { id }, data: input });
  }
}
