/**
 * FR-INS-03: "generate a proactive alert when a Bacenta's or Branch's
 * Church Pulse trend declines beyond a configurable threshold over a
 * configurable trailing window."
 */
/** §11.2's Pastor Emmanuel scenario: "Bacenta 12's Church Pulse has
 * dropped 15 points over 3 weeks" - the one concrete window PRD narrative
 * gives anywhere for a trend alert. `[PRD-DERIVED]`, not invented. */
export declare const DEFAULT_PULSE_TREND_WINDOW_DAYS = 21;
/**
 * `[INFERRED - PROVISIONAL]`, not a citation. FR-INS-03 requires the
 * threshold to be "configurable" but never states a default numeric
 * value anywhere in the PRD - unlike the trailing window (§11.2's
 * scenario gives a concrete 3-week example) or the signal-scoring window
 * (§8.1's "trailing 4-week average"), no comparable worked example pins a
 * threshold number. 10 points is a reasonable, disclosed placeholder
 * (smaller than §11.2's own 15-point illustrative drop, so that scenario
 * would in fact trigger under this default) - not a considered product
 * decision. See `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 */
export declare const DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = 10;
export interface PulseScorePoint {
    score: number;
    computedAt: Date;
}
export interface PulseTrendEvaluation {
    declined: boolean;
    deltaPoints: number;
    reason: string;
}
/**
 * Compares the earliest score within the trailing window against the
 * latest score overall. `history` need not be sorted - this function
 * sorts defensively rather than trusting caller order, since a
 * comparison in the wrong direction would silently invert "declined" into
 * "improved."
 */
export declare function evaluatePulseTrend(history: readonly PulseScorePoint[], now: Date, windowDays?: number, thresholdPoints?: number): PulseTrendEvaluation;
//# sourceMappingURL=pulse-trend.d.ts.map