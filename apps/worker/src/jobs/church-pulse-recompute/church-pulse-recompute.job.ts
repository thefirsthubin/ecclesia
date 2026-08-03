import { Injectable } from '@nestjs/common';
import {
  CHURCH_PULSE_SIGNAL_TYPES,
  computeChurchPulseScore,
  DEFAULT_CHURCH_PULSE_WEIGHTS,
  DEFAULT_CHURCH_PULSE_WINDOW_DAYS,
  DEFAULT_PULSE_TREND_WINDOW_DAYS,
  evaluatePulseTrend,
  isChurchPulseSignalType,
} from '@ecclesia/domain-insights';
import type { ChurchPulseSignalType } from '@ecclesia/domain-insights';
import type { PulseScoreScopeType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { ChurchPulseRecomputeRepository } from './church-pulse-recompute.repository';
import { BranchDirectoryRepository } from '../../platform/database/branch-directory.repository';
import { PrismaService } from '../../platform/database/prisma.service';

/** FR-INS-03's one alert type - identical constant to
 * `apps/api/src/modules/insights/services/alert.service.ts`'s own
 * `PULSE_DECLINE_ALERT_TYPE`, duplicated rather than imported for the
 * same Nx app-to-app boundary reason as everything else in this file. */
const PULSE_DECLINE_ALERT_TYPE = 'PULSE_DECLINE';

function toWeightsRecord(raw: Record<string, number> | null): Partial<Record<ChurchPulseSignalType, number>> {
  if (!raw) {
    return DEFAULT_CHURCH_PULSE_WEIGHTS;
  }
  const weights: Partial<Record<ChurchPulseSignalType, number>> = {};
  for (const type of CHURCH_PULSE_SIGNAL_TYPES) {
    if (typeof raw[type] === 'number') {
      weights[type] = raw[type];
    }
  }
  return weights;
}

/**
 * The church-pulse-recompute sweep (Blueprint §10.8's own worked example:
 * "Amazon EventBridge Scheduler triggering the Worker service... nightly
 * for silent-drift" implies a comparable cadence for the other named
 * jobs). `PulseScoreService.computeAndStore` (`apps/api/src/modules/
 * insights`) already implements this exact computation, but only
 * **compute-on-read** - "No scheduler/worker exists in this codebase... to
 * run this on the defined cadence FR-INS-01's acceptance criteria
 * describes," per that service's own doc comment. This job is that
 * missing scheduler: it runs the identical computation for **every**
 * Branch-scope and every active Bacenta-scope, not just whichever scope a
 * dashboard request happens to ask for, so `insights.pulse_scores`/
 * `pulse_score_history` stay fresh even when nobody is actively viewing a
 * dashboard, and FR-INS-03's decline alerts can fire on their own
 * schedule rather than only when a leader happens to open the dashboard
 * that would have recomputed the score anyway.
 *
 * **Deliberately publishes no Engagement Signal.** Unlike
 * `SilentDriftSweepJob`, this job's output (`Alert` rows) is already a
 * directly queryable resource `apps/api`'s existing dashboard endpoints
 * read (FR-INS-04) - there is no live-event counterpart for "Church Pulse
 * changed" that this needs to unify with under Blueprint §10.8's "one
 * downstream reaction mechanism regardless of trigger source" reasoning,
 * the way silent-drift's synthetic signal unifies with a (currently
 * unbuilt) live silent-drift-adjacent event. Publishing one here would be
 * inventing a consumer for it that doesn't exist.
 */
@Injectable()
export class ChurchPulseRecomputeJob {
  constructor(
    private readonly repository: ChurchPulseRecomputeRepository,
    private readonly branchDirectory: BranchDirectoryRepository,
    private readonly prisma: PrismaService,
    @InjectPinoLogger(ChurchPulseRecomputeJob.name) private readonly logger: PinoLogger,
  ) {}

  /** Returns the number of scopes (Branch + every active Bacenta) recomputed.
   *
   * `[Row-Level Security sprint]` `listBranches()` is the one unscoped
   * call; everything for one Branch - its own `computeAndStore` plus every
   * active Bacenta's `computeAndStore` inside it - runs inside that one
   * Branch's single `runInBranchScope` transaction, not a separate
   * transaction per scope. Unlike the other three sweep jobs, this one has
   * no single `sweepBranch` method to wrap - the whole per-branch block
   * below is wrapped inline instead. */
  async run(): Promise<number> {
    const branches = await this.branchDirectory.listBranches();
    let scopeCount = 0;
    for (const branch of branches) {
      scopeCount += await this.prisma.runInBranchScope(branch.id, () => this.recomputeBranch(branch.id));
    }
    return scopeCount;
  }

  private async recomputeBranch(branchId: string): Promise<number> {
    let scopeCount = 0;
    await this.computeAndStore(branchId, 'BRANCH', branchId, undefined);
    scopeCount += 1;

    const groups = await this.repository.listActiveBacentaGroups(branchId);
    for (const group of groups) {
      await this.computeAndStore(branchId, 'GROUP', group.id, group.id);
      scopeCount += 1;
    }
    return scopeCount;
  }

  private async computeAndStore(
    branchId: string,
    scopeType: PulseScoreScopeType,
    scopeId: string,
    groupIdFilter: string | undefined,
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - DEFAULT_CHURCH_PULSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const counts = await this.repository.countSignalsByTypeInWindow(branchId, groupIdFilter, windowStart, now);
    const signalCountsByType: Partial<Record<ChurchPulseSignalType, number>> = {};
    for (const row of counts) {
      if (isChurchPulseSignalType(row.signalType)) {
        signalCountsByType[row.signalType] = row.count;
      }
    }

    const rawWeights = await this.repository.findChurchPulseWeights(branchId);
    const weights = toWeightsRecord(rawWeights);
    const score = computeChurchPulseScore(signalCountsByType, weights);

    await this.repository.upsertPulseScore({ branchId, scopeType, scopeId, score, computedAt: now });
    await this.repository.appendPulseScoreHistory({ branchId, scopeType, scopeId, score, computedAt: now });

    await this.evaluateAndCreateAlertIfNeeded(branchId, scopeType, scopeId, now);
  }

  private async evaluateAndCreateAlertIfNeeded(
    branchId: string,
    scopeType: PulseScoreScopeType,
    scopeId: string,
    now: Date,
  ): Promise<void> {
    const since = new Date(now.getTime() - DEFAULT_PULSE_TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const history = await this.repository.findRecentHistoryByScope(scopeType, scopeId, since);
    const evaluation = evaluatePulseTrend(
      history.map((point) => ({ score: point.score.toNumber(), computedAt: point.computedAt })),
      now,
    );
    if (!evaluation.declined) {
      return;
    }

    const alreadyOpen = await this.repository.hasOpenAlert(scopeType, scopeId, PULSE_DECLINE_ALERT_TYPE);
    if (alreadyOpen) {
      this.logger.info({ scopeType, scopeId }, 'Church Pulse decline confirmed but an open PULSE_DECLINE alert already exists - no-op');
      return;
    }

    await this.repository.createAlert({ branchId, scopeType, scopeId, alertType: PULSE_DECLINE_ALERT_TYPE, message: evaluation.reason });
  }
}
