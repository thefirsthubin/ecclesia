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

  /**
   * FR-STW-08's progress aggregation: total pledged (every Pledge against
   * this Project) vs. total received (only the fulfilled ones - see
   * `stewardship.schemas.ts`'s `projectResponseSchema` doc comment for why
   * this sums each Pledge's own `pledgedAmountMinor`, not its linked
   * FinancialTransaction's amount). Two `aggregate` calls rather than one
   * `groupBy` - simpler to read, and this runs once per `GET /projects/:id`
   * against a per-Project Pledge count small enough that two queries over
   * one is not a meaningful cost here.
   */
  async sumByProject(projectId: string): Promise<{ totalPledgedMinor: bigint; totalReceivedMinor: bigint }> {
    const [pledgedAgg, receivedAgg] = await Promise.all([
      this.prisma.pledge.aggregate({ where: { projectId }, _sum: { pledgedAmountMinor: true } }),
      this.prisma.pledge.aggregate({
        where: { projectId, fulfilledTransactionId: { not: null } },
        _sum: { pledgedAmountMinor: true },
      }),
    ]);
    return {
      totalPledgedMinor: pledgedAgg._sum.pledgedAmountMinor ?? 0n,
      totalReceivedMinor: receivedAgg._sum.pledgedAmountMinor ?? 0n,
    };
  }
}
