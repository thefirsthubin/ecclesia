import { Injectable } from '@nestjs/common';
import type { Pledge } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreatePledgeRecord {
  branchId: string;
  projectId: string;
  personId: string;
  pledgedAmountMinor: bigint;
  currency: string;
  reminderOptIn: boolean;
}

/** Prisma-backed persistence for `stewardship.pledges` (FR-STW-08/H2). */
@Injectable()
export class PledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreatePledgeRecord): Promise<Pledge> {
    return this.prisma.pledge.create({ data: input });
  }

  findById(id: string): Promise<Pledge | null> {
    return this.prisma.pledge.findUnique({ where: { id } });
  }

  fulfill(id: string, fulfilledTransactionId: string): Promise<Pledge> {
    return this.prisma.pledge.update({ where: { id }, data: { fulfilledTransactionId } });
  }
}
