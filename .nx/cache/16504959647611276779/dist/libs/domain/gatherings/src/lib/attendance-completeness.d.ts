/**
 * FR-GTH-05: "flag Gatherings with no attendance recorded past the
 * configured window." US-D3's acceptance criterion pins the shipped
 * default: "a Bacenta Meeting has no attendance recorded 48 hours past
 * its scheduled end." The window itself is Branch-configurable per
 * NFR-MAINT-01 (same "configuration, not hard-coded" discipline as every
 * other threshold in this codebase - silent-drift's N/M, Follow-up
 * task's SLA days).
 */
export declare const DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS = 48;
export interface AttendanceCompletenessInput {
    /** A Gathering with no `scheduledEnd` (schema allows it to be null) has
     * nothing to measure "past the window" against and is never flagged. */
    scheduledEnd: Date | null;
    hasAttendanceRecorded: boolean;
    now: Date;
    windowHours?: number;
}
export interface AttendanceCompletenessOutcome {
    incomplete: boolean;
    reason: string;
}
export declare function evaluateAttendanceCompleteness(input: AttendanceCompletenessInput): AttendanceCompletenessOutcome;
//# sourceMappingURL=attendance-completeness.d.ts.map