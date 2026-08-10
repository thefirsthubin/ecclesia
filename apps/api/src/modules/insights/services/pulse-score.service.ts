import { Injectable } from '@nestjs/common';
import type { PulseScoreResponseDto } from '@ecclesia/contracts';
import {
  CHURCH_PULSE_SIGNAL_TYPES,
  computeChurchPulseScore,
  DEFAULT_CHURCH_PULSE_WEIGHTS,
  DEFAULT_CHURCH_PULSE_WINDOW_DAYS,
  mapEngagementSignalToChurchPulseCategory,
} from '@ecclesia/domain-insights';
import type { ChurchPulseSignalType } from '@ecclesia/domain-insights';
import type { PulseScore, PulseScoreScopeType } from '@prisma/client';

import { EngagementSignalRepository } from '../repositories/engagement-signal.repository';
import { PulseScoreHistoryRepository } from '../repositories/pulse-score-history.repository';
import { PulseScoreRepository } from '../repositories/pulse-score.repository';
import { AlertService } from './alert.service';

function toResponseDto(pulseScore: PulseScore): PulseScoreResponseDto {
  return {
    id: pulseScore.id,
    branchId: pulseScore.branchId,
    scopeType: pulseScore.scopeType,
    scopeId: pulseScore.scopeId,
    score: pulseScore.score.toNumber(),
    computedAt: pulseScore.computedAt.toISOString(),
  };
}

/** Falls back to `DEFAULT_CHURCH_PULSE_WEIGHTS` (OQ-10's equal-sixths
 * placeholder) when a Branch has no `church_pulse_weights` configured
 * yet, or when its configured value contains no recognized signal-type
 * keys - defensive against a partially/incorrectly configured Branch,
 * matching `computeChurchPulseScore()`'s own "missing category = 0"
 * philosophy rather than throwing. */
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
 * FR-INS-01: computes and stores Church Pulse for **Group (Bacenta) and
 * Branch scope only**.
 *
 * **NFR-PRIV-02 (RISK-06) is a hard release gate, not a scope-management
 * choice**: "Person-level Church Pulse scoring must not ship until a
 * separate access-control review is complete." This class deliberately
 * has no `computeAndStorePersonScore` method and no code path capable of
 * constructing a `PERSON`-scoped `PulseScore`/`PulseScoreHistory` row -
 * both public methods below hard-code `scopeType` to `'BRANCH'` or
 * `'GROUP'`.
 *
 * **Compute-on-read.** No scheduler/worker exists in this codebase (see
 * `INSIGHTS_DESIGN_NOTES.md`) to run this on the "defined cadence"
 * FR-INS-01's acceptance criteria describes. Every call recomputes the
 * score fresh from the trailing `DEFAULT_CHURCH_PULSE_WINDOW_DAYS`-day
 * window of `EngagementSignal` rows, upserts the `PulseScore` "current"
 * row, appends a `PulseScoreHistory` point, and hands off to
 * `AlertService.evaluateAndCreateIfNeeded` (FR-INS-03) - all as a side
 * effect of a dashboard endpoint being read, not a background job.
 */
@Injectable()
export class PulseScoreService {
  constructor(
    private readonly engagementSignalRepository: EngagementSignalRepository,
    private readonly pulseScoreRepository: PulseScoreRepository,
    private readonly pulseScoreHistoryRepository: PulseScoreHistoryRepository,
    private readonly alertService: AlertService,
  ) {}

  computeAndStoreBranchScore(branchId: string): Promise<PulseScoreResponseDto> {
    return this.computeAndStore(branchId, 'BRANCH', branchId, undefined);
  }

  computeAndStoreGroupScore(branchId: string, groupId: string): Promise<PulseScoreResponseDto> {
    return this.computeAndStore(branchId, 'GROUP', groupId, groupId);
  }

  private async computeAndStore(
    branchId: string,
    scopeType: PulseScoreScopeType,
    scopeId: string,
    groupIdFilter: string | undefined,
  ): Promise<PulseScoreResponseDto> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - DEFAULT_CHURCH_PULSE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const counts = await this.engagementSignalRepository.countByTypeInWindow(branchId, groupIdFilter, windowStart, now);
    const signalCountsByType: Partial<Record<ChurchPulseSignalType, number>> = {};
    for (const row of counts) {
      const category = mapEngagementSignalToChurchPulseCategory(row.signalType);
      if (category) {
        // Multiple raw event types can map to one category (e.g.
        // `attendance.recorded` and `bacenta_meeting.attendance_recorded`
        // both -> ATTENDANCE), and `countByTypeInWindow` groups by the raw
        // signalType, not the category - accumulate rather than overwrite.
        signalCountsByType[category] = (signalCountsByType[category] ?? 0) + row.count;
      }
    }

    const rawWeights = await this.pulseScoreRepository.findChurchPulseWeights(branchId);
    const weights = toWeightsRecord(rawWeights);
    const score = computeChurchPulseScore(signalCountsByType, weights);

    const pulseScore = await this.pulseScoreRepository.upsert({ branchId, scopeType, scopeId, score, computedAt: now });
    await this.pulseScoreHistoryRepository.append({ branchId, scopeType, scopeId, score, computedAt: now });
    await this.alertService.evaluateAndCreateIfNeeded(branchId, scopeType, scopeId, now);

    return toResponseDto(pulseScore);
  }
}
