import { Injectable } from '@nestjs/common';
import type { Alert, PulseScore, PulseScoreHistory, PulseScoreScopeType } from '@prisma/client';

import { PrismaService } from '../../platform/database/prisma.service';

export interface SignalCountByType {
  signalType: string;
  count: number;
}

export interface UpsertPulseScoreRecord {
  branchId: string;
  scopeType: PulseScoreScopeType;
  scopeId: string;
  score: number;
  computedAt: Date;
}

export type AppendPulseScoreHistoryRecord = UpsertPulseScoreRecord;

export interface CreateAlertRecord {
  branchId: string;
  scopeType: PulseScoreScopeType;
  scopeId: string;
  alertType: string;
  message?: string;
}

/**
 * apps/worker's own Prisma-backed queries for the church-pulse-recompute
 * sweep - a worker-local mirror of `apps/api/src/modules/insights`'s
 * `EngagementSignalRepository.countByTypeInWindow`, `PulseScoreRepository`,
 * `PulseScoreHistoryRepository`, and `AlertRepository`'s
 * `create`/`hasOpenAlert` methods, consolidated into one repository file
 * the same way `SilentDriftSweepRepository` consolidates several small
 * queries for its own job - not an import of any of those apps/api
 * classes, for the same Nx app-to-app boundary reason documented
 * throughout `WORKER_DESIGN_NOTES.md`.
 */
@Injectable()
export class ChurchPulseRecomputeRepository {
  constructor(private readonly prisma: PrismaService) {}

  // `[Row-Level Security sprint]` `listBranches()` moved to
  // `BranchDirectoryRepository` - see that class's own doc comment.

  /** Every currently-`ACTIVE` Bacenta (`GroupType.PASTORAL_CARE`) in a
   * Branch - `PulseScoreService.computeAndStoreGroupScore`'s own
   * per-request equivalent, run here for every Bacenta on a schedule
   * instead of only the one a dashboard read happens to ask for. */
  listActiveBacentaGroups(branchId: string): Promise<{ id: string }[]> {
    return this.prisma.group.findMany({
      where: { branchId, type: 'PASTORAL_CARE', lifecycleStatus: 'ACTIVE' },
      select: { id: true },
    });
  }

  /** Mirrors `EngagementSignalRepository.countByTypeInWindow` exactly -
   * `groupId` omitted computes the Branch-wide count, supplied computes
   * one Group's. */
  async countSignalsByTypeInWindow(
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

  /** Mirrors `PulseScoreRepository.findChurchPulseWeights` exactly. */
  async findChurchPulseWeights(branchId: string): Promise<Record<string, number> | null> {
    const configuration = await this.prisma.configuration.findUnique({
      where: { branchId },
      select: { churchPulseWeights: true },
    });
    if (!configuration || configuration.churchPulseWeights === null || typeof configuration.churchPulseWeights !== 'object') {
      return null;
    }
    return configuration.churchPulseWeights as unknown as Record<string, number>;
  }

  upsertPulseScore(input: UpsertPulseScoreRecord): Promise<PulseScore> {
    return this.prisma.pulseScore.upsert({
      where: { scopeType_scopeId: { scopeType: input.scopeType, scopeId: input.scopeId } },
      create: input,
      update: { score: input.score, computedAt: input.computedAt },
    });
  }

  appendPulseScoreHistory(input: AppendPulseScoreHistoryRecord): Promise<PulseScoreHistory> {
    return this.prisma.pulseScoreHistory.create({ data: input });
  }

  findRecentHistoryByScope(scopeType: PulseScoreScopeType, scopeId: string, since: Date): Promise<PulseScoreHistory[]> {
    return this.prisma.pulseScoreHistory.findMany({
      where: { scopeType, scopeId, computedAt: { gte: since } },
      orderBy: { computedAt: 'asc' },
    });
  }

  async hasOpenAlert(scopeType: PulseScoreScopeType, scopeId: string, alertType: string): Promise<boolean> {
    const existing = await this.prisma.alert.findFirst({ where: { scopeType, scopeId, alertType, status: 'OPEN' } });
    return existing !== null;
  }

  createAlert(input: CreateAlertRecord): Promise<Alert> {
    return this.prisma.alert.create({ data: input });
  }
}
