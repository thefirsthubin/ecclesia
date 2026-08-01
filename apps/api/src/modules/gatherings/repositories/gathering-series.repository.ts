import { Injectable } from '@nestjs/common';
import type { GatheringSeries } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateGatheringSeriesRecord {
  branchId: string;
  type: string;
  groupId?: string;
  recurrenceRule?: string;
  startDate: Date;
  endDate?: Date;
  createdByPersonId: string;
}

/**
 * Prisma-backed persistence for `gatherings.gathering_series` (FR-GTH-02).
 * Schema-scoped per Blueprint §6.4/§7.2, same rule as every other
 * repository in this codebase. See `PersonRepository`'s doc comment for
 * the explicit-`branchId`-filtering rationale (RLS not yet wired).
 */
@Injectable()
export class GatheringSeriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateGatheringSeriesRecord): Promise<GatheringSeries> {
    return this.prisma.gatheringSeries.create({ data: input });
  }

  findById(id: string): Promise<GatheringSeries | null> {
    return this.prisma.gatheringSeries.findUnique({ where: { id } });
  }
}
