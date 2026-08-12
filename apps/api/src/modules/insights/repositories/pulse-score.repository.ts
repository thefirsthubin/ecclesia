import { Injectable } from '@nestjs/common';
import type { PulseScore, PulseScoreScopeType } from '@prisma/client';

import { PrismaService } from '../../../platform/database/prisma.service';

export interface UpsertPulseScoreRecord {
  branchId: string;
  scopeType: PulseScoreScopeType;
  scopeId: string;
  score: number;
  computedAt: Date;
}

/**
 * Prisma-backed persistence for `insights.pulse_scores` - the current/
 * latest score per scope (see `PulseScore`'s own doc comment in
 * `db/schema.prisma` for why this is split from `pulse_score_history`).
 */
@Injectable()
export class PulseScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(input: UpsertPulseScoreRecord): Promise<PulseScore> {
    return this.prisma.pulseScore.upsert({
      where: { scopeType_scopeId: { scopeType: input.scopeType, scopeId: input.scopeId } },
      create: input,
      update: { score: input.score, computedAt: input.computedAt },
    });
  }

  findByScope(scopeType: PulseScoreScopeType, scopeId: string): Promise<PulseScore | null> {
    return this.prisma.pulseScore.findUnique({ where: { scopeType_scopeId: { scopeType, scopeId } } });
  }

  /**
   * `[Resident Pastor Dashboard - Bacenta Leaderboard milestone]` Reads
   * every already-computed `GROUP`-scoped `PulseScore` for a Branch, in
   * one query - **never recomputes anything** (unlike
   * `PulseScoreService.computeAndStoreGroupScore`, the compute-on-read path
   * `GET /insights/bacenta-dashboard/:groupId` uses for a single Bacenta).
   * The Bacenta Leaderboard only ever wants Branches' worth of Bacentas
   * that `apps/worker`'s `ChurchPulseRecomputeJob` sweep has already
   * scored - a plain read over that persisted state, exactly as the
   * milestone brief requires ("do NOT recalculate the scores").
   */
  findByBranchAndScopeType(branchId: string, scopeType: PulseScoreScopeType): Promise<PulseScore[]> {
    return this.prisma.pulseScore.findMany({ where: { branchId, scopeType } });
  }

  /**
   * Reads `platform.configurations.church_pulse_weights` for a Branch
   * (FR-INS-02/OQ-10) - queried directly via Prisma rather than through
   * `BranchConfigurationService` (`apps/api/src/platform/rbac`), since
   * that service's `BranchConfiguration` shape only carries
   * `poimenGateEnabled` (Blueprint §9.3's own record-level-check need);
   * widening a libs/rbac-facing contract for an Insights-only field would
   * be the wrong layer for it. Mirrors `FinancialTransactionRepository`'s
   * own precedent of querying `platform.*` tables directly as shared
   * infrastructure (Blueprint §7.2), not a module-boundary violation.
   * Returns `null` (not a thrown error) when unconfigured - "a Branch has
   * not yet touched the H2 weight-configuration screen" is the expected
   * steady state for every Branch in this milestone, since FR-INS-02
   * itself is H2 and not built here (see INSIGHTS_DESIGN_NOTES.md); the
   * caller falls back to `DEFAULT_CHURCH_PULSE_WEIGHTS`.
   */
  async findChurchPulseWeights(branchId: string): Promise<Record<string, number> | null> {
    const configuration = await this.prisma.configuration.findUnique({
      where: { branchId },
      select: { churchPulseWeights: true },
    });
    if (!configuration || configuration.churchPulseWeights === null || typeof configuration.churchPulseWeights !== 'object') {
      return null;
    }
    // `churchPulseWeights` is Prisma's `JsonValue` (a broad recursive
    // union) - going through `unknown` first avoids TS2352 ("conversion
    // may be a mistake") that a direct cast to `Record<string, number>`
    // risks, since `JsonValue` and `Record<string, number>` don't
    // structurally overlap enough for TS to accept a direct assertion.
    return configuration.churchPulseWeights as unknown as Record<string, number>;
  }
}
