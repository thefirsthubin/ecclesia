import { Injectable } from '@nestjs/common';
import type { PulseScoreHistory, PulseScoreScopeType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface AppendPulseScoreHistoryRecord {
  branchId: string;
  scopeType: PulseScoreScopeType;
  scopeId: string;
  score: number;
  computedAt: Date;
}

/**
 * Prisma-backed persistence for `insights.pulse_score_history` - the full
 * time series `evaluatePulseTrend()` (FR-INS-03,
 * `libs/domain/insights`) reads from. Append-only, mirroring
 * `EngagementSignalRepository`.
 */
@Injectable()
export class PulseScoreHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  append(input: AppendPulseScoreHistoryRecord): Promise<PulseScoreHistory> {
    return this.prisma.pulseScoreHistory.create({ data: input });
  }

  findRecentByScope(scopeType: PulseScoreScopeType, scopeId: string, since: Date): Promise<PulseScoreHistory[]> {
    return this.prisma.pulseScoreHistory.findMany({
      where: { scopeType, scopeId, computedAt: { gte: since } },
      orderBy: { computedAt: 'asc' },
    });
  }
}
