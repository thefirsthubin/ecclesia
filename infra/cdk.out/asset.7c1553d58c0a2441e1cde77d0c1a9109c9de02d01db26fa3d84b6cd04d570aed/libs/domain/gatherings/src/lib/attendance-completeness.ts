/**
 * FR-GTH-05: "flag Gatherings with no attendance recorded past the
 * configured window." US-D3's acceptance criterion pins the shipped
 * default: "a Bacenta Meeting has no attendance recorded 48 hours past
 * its scheduled end." The window itself is Branch-configurable per
 * NFR-MAINT-01 (same "configuration, not hard-coded" discipline as every
 * other threshold in this codebase - silent-drift's N/M, Follow-up
 * task's SLA days).
 */

export const DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS = 48;

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

export function evaluateAttendanceCompleteness(input: AttendanceCompletenessInput): AttendanceCompletenessOutcome {
  if (input.hasAttendanceRecorded) {
    return { incomplete: false, reason: 'Attendance has already been recorded for this Gathering' };
  }
  if (!input.scheduledEnd) {
    return {
      incomplete: false,
      reason: 'FR-GTH-05: this Gathering has no scheduledEnd to measure the completeness window against',
    };
  }

  const windowHours = input.windowHours ?? DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS;
  const windowMs = windowHours * 60 * 60 * 1000;
  const deadline = new Date(input.scheduledEnd.getTime() + windowMs);
  const incomplete = input.now.getTime() > deadline.getTime();

  return {
    incomplete,
    reason: incomplete
      ? `FR-GTH-05: no attendance recorded ${windowHours}h past this Gathering's scheduled end`
      : `FR-GTH-05: still within the ${windowHours}h completeness window`,
  };
}
