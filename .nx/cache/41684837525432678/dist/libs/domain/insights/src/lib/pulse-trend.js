"use strict";
/**
 * FR-INS-03: "generate a proactive alert when a Bacenta's or Branch's
 * Church Pulse trend declines beyond a configurable threshold over a
 * configurable trailing window."
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = exports.DEFAULT_PULSE_TREND_WINDOW_DAYS = void 0;
exports.evaluatePulseTrend = evaluatePulseTrend;
/** §11.2's Pastor Emmanuel scenario: "Bacenta 12's Church Pulse has
 * dropped 15 points over 3 weeks" - the one concrete window PRD narrative
 * gives anywhere for a trend alert. `[PRD-DERIVED]`, not invented. */
exports.DEFAULT_PULSE_TREND_WINDOW_DAYS = 21;
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
exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS = 10;
/**
 * Compares the earliest score within the trailing window against the
 * latest score overall. `history` need not be sorted - this function
 * sorts defensively rather than trusting caller order, since a
 * comparison in the wrong direction would silently invert "declined" into
 * "improved."
 */
function evaluatePulseTrend(history, now, windowDays = exports.DEFAULT_PULSE_TREND_WINDOW_DAYS, thresholdPoints = exports.DEFAULT_PULSE_DECLINE_THRESHOLD_POINTS) {
    const sorted = [...history].sort((a, b) => a.computedAt.getTime() - b.computedAt.getTime());
    if (sorted.length < 2) {
        return { declined: false, deltaPoints: 0, reason: 'Not enough score history to evaluate a trend' };
    }
    const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const withinWindow = sorted.filter((point) => point.computedAt.getTime() >= windowStart.getTime());
    const earliest = withinWindow.length > 0 ? withinWindow[0] : sorted[0];
    const latest = sorted[sorted.length - 1];
    const deltaPoints = latest.score - earliest.score;
    const declined = deltaPoints <= -thresholdPoints;
    return {
        declined,
        deltaPoints,
        reason: declined
            ? `FR-INS-03: Church Pulse declined ${Math.abs(deltaPoints).toFixed(2)} points over the trailing ${windowDays}-day window (threshold: ${thresholdPoints})`
            : `FR-INS-03: Church Pulse change of ${deltaPoints.toFixed(2)} points is within the trailing ${windowDays}-day window's ${thresholdPoints}-point threshold`,
    };
}
//# sourceMappingURL=pulse-trend.js.map