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
export interface SilentDriftEvaluationInput {
    /** Node A. A Person with no active Bacenta assignment is excluded from
     * this evaluation entirely (§19.3 Exceptions) - a BR-PPL-01
     * data-integrity concern instead, not a pastoral-response one. */
    hasActiveBacentaAssignment: boolean;
    /** How many of the Person's last `attendanceThreshold` Sunday/Wed/Fri
     * Gatherings they attended. */
    recentGatheringAttendedCount: number;
    /** N (PRD §15.8/OQ-04, Branch-configurable via
     * `platform.configurations.silent_drift_config`; ships with 3). */
    attendanceThreshold: number;
    /** How many of the Person's last `bacentaThreshold` Bacenta Meetings
     * they attended. */
    recentBacentaAttendedCount: number;
    /** M (PRD §15.8/OQ-04; ships with 3). */
    bacentaThreshold: number;
}
export type SilentDriftClassification = 'NO_ACTIVE_BACENTA' | 'GENERAL_DISENGAGEMENT' | 'HEALTHY' | 'SILENT_DRIFT';
export interface SilentDriftOutcome {
    flagged: boolean;
    classification: SilentDriftClassification;
    reason: string;
    /** Populated only when `flagged` - mirrors
     * `db/schema.prisma`'s `SilentDriftFlag.attendanceMissedCount`/
     * `bacentaMissedCount` fields, computed here so callers persist a value
     * this function itself derived rather than recomputing it. */
    attendanceMissedCount?: number;
    bacentaMissedCount?: number;
}
/**
 * The pure decision. Takes attendance *counts* as inputs rather than raw
 * attendance records - deliberately, since the Gatherings domain (the
 * actual source of `gatherings.attendance_records`) does not exist yet in
 * this codebase. See `PASTORAL_CARE_DESIGN_NOTES.md`'s open-question entry
 * for the real sweep/trigger that will compute these counts once
 * Gatherings is built; this function is ready to consume that output
 * unchanged.
 */
export declare function evaluateSilentDrift(input: SilentDriftEvaluationInput): SilentDriftOutcome;
//# sourceMappingURL=silent-drift.d.ts.map