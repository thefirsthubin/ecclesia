import { Injectable } from '@nestjs/common';
import type { EngagementSignal, Prisma } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface CreateEngagementSignalRecord {
  branchId: string;
  personId?: string;
  groupId?: string;
  signalType: string;
  /** `payload Json` (non-nullable, no `Prisma.JsonNull` case needed here
   * unlike Gatherings' nullable `config` - see `gathering.repository.ts`
   * for that precedent). */
  payload: Prisma.InputJsonValue;
  occurredAt: Date;
}

export interface SignalCountByType {
  signalType: string;
  count: number;
}

/**
 * Prisma-backed persistence for `insights.engagement_signals` - an
 * append-only stream (Blueprint §4.3 rule 3, PRD §12.8). No `update`/
 * `delete` method exists here by design, mirroring
 * `financial_transaction_events`' own event-log precedent.
 */
@Injectable()
export class EngagementSignalRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateEngagementSignalRecord): Promise<EngagementSignal> {
    return this.prisma.engagementSignal.create({ data: input });
  }

  /**
   * Raw signal counts per type within a trailing window, scoped either to
   * a whole Branch (`groupId` omitted) or to one Group within it
   * (`groupId` supplied) - the two shapes `PulseScoreService` needs for
   * Branch-level vs. Group-level Church Pulse (FR-INS-01). Deliberately
   * has no `personId` filter parameter - see `PulseScoreService`'s doc
   * comment (NFR-PRIV-02: Person-level scoring must not ship).
   */
  async countByTypeInWindow(
    branchId: string,
    groupId: string | undefined,
    windowStart: Date,
    now: Date,
  ): Promise<SignalCountByType[]> {
    const grouped = await this.prisma.engagementSignal.groupBy({
      by: ['signalType'],
      where: {
        branchId,
        ...(groupId ? { groupId } : {}),
        occurredAt: { gte: windowStart, lte: now },
      },
      _count: { _all: true },
    });
    return grouped.map((row) => ({ signalType: row.signalType, count: row._count._all }));
  }
}
