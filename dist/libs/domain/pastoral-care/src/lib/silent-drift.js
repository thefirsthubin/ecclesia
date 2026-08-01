"use strict";
/**
 * PRD §15.8's decision tree, transcribed into an implementable,
 * framework-agnostic function - BR-PC-02 ("a Person attending Sunday/
 * Wednesday/Friday Gatherings regularly while not attending their
 * assigned Bacenta's meetings constitutes a pastoral concern") and
 * FR-PC-05 (the system-level requirement to detect and flag it).
 *
 * ```mermaid
 * flowchart TD
 *     A[Person has an active Bacenta assignment?] -->|No| Z1[Not evaluated - BR-PPL-01 data-integrity issue]
 *     A -->|Yes| B{Attended >= threshold of last N Sunday/Wed/Fri Gatherings?}
 *     B -->|No| Z2[Not flagged - may be general disengagement, a separate signal]
 *     B -->|Yes| C{Attended >= threshold of last M Bacenta Meetings?}
 *     C -->|Yes| Z3[Healthy - no flag]
 *     C -->|No| D[Flag as Silent Drift]
 * ```
 *
 * §19.3 step 1 makes explicit that nodes D onward (notify Shepherd, SLA,
 * escalate to Assistant Pastor per BR-PC-04) are the *response* workflow
 * that follows a flag being raised - modeled separately in
 * `follow-up-task.ts`'s SLA/escalation functions, since a
 * `SilentDriftFlag`'s subsequent lifecycle (`SilentDriftStatus`:
 * FLAGGED -> RESOLVED/ESCALATED, `db/schema.prisma`) is a stateful record,
 * not a re-evaluation of this same decision.
 *
 * **The "N" / "threshold" wording, resolved.** PRD §15.8's own diagram
 * text says "Attended >= threshold of last N ... Gatherings" for one
 * value (N) and, symmetrically, "last M Bacenta Meetings" for the other -
 * but §15.8's prose and FR-PC-05/OQ-04 never introduce a third, separately
 * -configured "threshold" distinct from N and M themselves ("ships with
 * N=3/M=3 as an explicitly provisional placeholder" - only two numbers are
 * ever named). [INFERRED] This function therefore treats N and M as both
 * the evaluation window size *and* the required attended-count within
 * that window (i.e. "attended >= N of the last N" - perfect attendance
 * required to pass node B, and symmetrically for node C) - the only
 * reading consistent with exactly two configured symbols existing. See
 * `PASTORAL_CARE_DESIGN_NOTES.md`.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSilentDrift = evaluateSilentDrift;
/**
 * The pure decision. Takes attendance *counts* as inputs rather than raw
 * attendance records - deliberately, since the Gatherings domain (the
 * actual source of `gatherings.attendance_records`) does not exist yet in
 * this codebase. See `PASTORAL_CARE_DESIGN_NOTES.md`'s open-question entry
 * for the real sweep/trigger that will compute these counts once
 * Gatherings is built; this function is ready to consume that output
 * unchanged.
 */
function evaluateSilentDrift(input) {
    // Node A
    if (!input.hasActiveBacentaAssignment) {
        return {
            flagged: false,
            classification: 'NO_ACTIVE_BACENTA',
            reason: 'PRD §15.8 node Z1 / §19.3 Exceptions: no active Bacenta assignment - a BR-PPL-01 data-integrity issue, not a silent-drift evaluation',
        };
    }
    // Node B
    if (input.recentGatheringAttendedCount < input.attendanceThreshold) {
        return {
            flagged: false,
            classification: 'GENERAL_DISENGAGEMENT',
            reason: `PRD §15.8 node Z2: attended ${input.recentGatheringAttendedCount} of the last ${input.attendanceThreshold} Sunday/Wed/Fri Gatherings - below threshold, so not silent drift (may be general disengagement, a separate signal)`,
        };
    }
    // Node C
    if (input.recentBacentaAttendedCount >= input.bacentaThreshold) {
        return {
            flagged: false,
            classification: 'HEALTHY',
            reason: `PRD §15.8 node Z3: attended ${input.recentBacentaAttendedCount} of the last ${input.bacentaThreshold} Bacenta Meetings - healthy, no flag`,
        };
    }
    // Node D
    const attendanceMissedCount = Math.max(input.attendanceThreshold - input.recentGatheringAttendedCount, 0);
    const bacentaMissedCount = Math.max(input.bacentaThreshold - input.recentBacentaAttendedCount, 0);
    return {
        flagged: true,
        classification: 'SILENT_DRIFT',
        reason: `PRD §15.8 node D / BR-PC-02: attended ${input.recentGatheringAttendedCount} of the last ${input.attendanceThreshold} Sunday/Wed/Fri Gatherings but only ${input.recentBacentaAttendedCount} of the last ${input.bacentaThreshold} Bacenta Meetings`,
        attendanceMissedCount,
        bacentaMissedCount,
    };
}
//# sourceMappingURL=silent-drift.js.map