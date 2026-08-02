"use strict";
/**
 * PRD §12.8's Church Pulse weighted-scoring model: a stream of typed
 * Engagement Signals, reduced to a per-category sub-score, then combined
 * via configurable weights into one composite 0-100 score.
 *
 * **The six signal categories are `[PRD-DERIVED]`, not `[BLUEPRINT-EXACT]`.**
 * §12.8's own flowchart names six *signal source* boxes (Attendance
 * Records, Group Membership changes, Financial Transactions, Follow-up
 * task outcomes, Role Assignments, Visitor-to-Member conversions); §8.1
 * separately names six *scoring* categories (attendance consistency,
 * Bacenta participation, serving activity, follow-up responsiveness,
 * leadership engagement, visitor retention) that do not map 1:1 onto the
 * flowchart's six boxes (e.g. "leadership engagement" and "serving
 * activity" both plausibly derive from the same Role Assignment signal
 * source; "Financial Transactions" is a signal source with no
 * identically-named §8.1 scoring category). This module treats the
 * flowchart's six *signal source* types as the computational unit - one
 * weight per source type - since that is what the `EngagementSignal`
 * entity itself is typed by (`signalType`), and flags this narrative
 * inconsistency rather than silently resolving it with an invented
 * mapping table.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = exports.DEFAULT_CHURCH_PULSE_WEIGHTS = exports.DEFAULT_CHURCH_PULSE_WINDOW_DAYS = exports.CHURCH_PULSE_SIGNAL_TYPES = void 0;
exports.isChurchPulseSignalType = isChurchPulseSignalType;
exports.computeCategoryScore = computeCategoryScore;
exports.computeChurchPulseScore = computeChurchPulseScore;
exports.CHURCH_PULSE_SIGNAL_TYPES = [
    'ATTENDANCE',
    'GROUP_MEMBERSHIP',
    'FINANCIAL_GIVING',
    'FOLLOW_UP_OUTCOME',
    'ROLE_ASSIGNMENT',
    'VISITOR_CONVERSION',
];
function isChurchPulseSignalType(value) {
    return exports.CHURCH_PULSE_SIGNAL_TYPES.includes(value);
}
/** PRD §8.1: "Church Pulse Score (congregation-level, trailing 4-week
 * average)" - the one concrete window PRD text gives anywhere for this
 * computation. `[PRD-DERIVED]`, not invented. */
exports.DEFAULT_CHURCH_PULSE_WINDOW_DAYS = 28;
/**
 * **Resolved OQ-10 (§24), provisional value:** "Release 1 ships with
 * equal weighting across all six signal categories as an explicitly
 * labeled provisional placeholder." This is that placeholder, exactly as
 * the PRD itself describes it - not this module's own invention.
 */
exports.DEFAULT_CHURCH_PULSE_WEIGHTS = {
    ATTENDANCE: 1 / 6,
    GROUP_MEMBERSHIP: 1 / 6,
    FINANCIAL_GIVING: 1 / 6,
    FOLLOW_UP_OUTCOME: 1 / 6,
    ROLE_ASSIGNMENT: 1 / 6,
    VISITOR_CONVERSION: 1 / 6,
};
/**
 * **`[INFERRED - PROVISIONAL]`, not a citation.** Neither the PRD nor the
 * Blueprint specify how a raw signal *count* within the trailing window
 * becomes a 0-100 sub-score for a category - §12.8 explicitly defers "the
 * exact weighting formula, decay function... and alert thresholds" to
 * this functional domain chapter, but PRD §13.6's FR-INS rows never
 * actually supply that formula either. This is a genuine specification
 * gap, not an oversight this module resolves quietly - `10 signals in the
 * trailing window == a full 100 for that category, linear below that` is
 * an explicitly-labeled placeholder in exactly the same spirit as OQ-10's
 * own "provisional... pending calibration" framing for the weights
 * themselves, not a considered product decision. See
 * `apps/api/src/modules/insights/INSIGHTS_DESIGN_NOTES.md`.
 */
exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE = 10;
function computeCategoryScore(signalCount) {
    if (signalCount <= 0) {
        return 0;
    }
    return Math.min(100, (signalCount / exports.PROVISIONAL_SIGNALS_FOR_FULL_CATEGORY_SCORE) * 100);
}
/**
 * BR-INS-01: "must not be reducible to attendance alone." Combines each
 * category's sub-score via the supplied weights (defensively normalized
 * to sum to 1, so a caller supplying a partial or unnormalized weight set
 * - e.g. from `platform.configurations.church_pulse_weights` before an
 * Admin has ever touched it - still produces a valid 0-100 result rather
 * than a silently-wrong one). A category absent from `signalCountsByType`
 * is treated as a count of 0, not excluded from the weighted average -
 * missing data pulls the score down, it does not shrink the denominator
 * (the same "flag incompleteness, don't ignore it" principle
 * `evaluateAttendanceCompleteness` already applies to Gatherings).
 */
function computeChurchPulseScore(signalCountsByType, weights = exports.DEFAULT_CHURCH_PULSE_WEIGHTS) {
    const totalWeight = exports.CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => sum + (weights[type] ?? 0), 0);
    if (totalWeight <= 0) {
        return 0;
    }
    const weightedSum = exports.CHURCH_PULSE_SIGNAL_TYPES.reduce((sum, type) => {
        const weight = weights[type] ?? 0;
        const categoryScore = computeCategoryScore(signalCountsByType[type] ?? 0);
        return sum + weight * categoryScore;
    }, 0);
    return Math.round((weightedSum / totalWeight) * 100) / 100;
}
//# sourceMappingURL=church-pulse-scoring.js.map