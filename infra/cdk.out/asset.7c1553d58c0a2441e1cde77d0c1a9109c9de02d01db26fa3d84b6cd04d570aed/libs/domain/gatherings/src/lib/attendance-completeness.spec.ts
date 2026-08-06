import { DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS, evaluateAttendanceCompleteness } from './attendance-completeness';

describe('evaluateAttendanceCompleteness (FR-GTH-05)', () => {
  it('is never incomplete once attendance has been recorded', () => {
    const result = evaluateAttendanceCompleteness({
      scheduledEnd: new Date('2026-08-01T10:00:00Z'),
      hasAttendanceRecorded: true,
      now: new Date('2026-08-10T00:00:00Z'),
    });
    expect(result.incomplete).toBe(false);
  });

  it('is never incomplete when the Gathering has no scheduledEnd', () => {
    const result = evaluateAttendanceCompleteness({
      scheduledEnd: null,
      hasAttendanceRecorded: false,
      now: new Date('2026-08-10T00:00:00Z'),
    });
    expect(result.incomplete).toBe(false);
  });

  it('defaults to a 48-hour window (US-D3 acceptance criterion)', () => {
    expect(DEFAULT_ATTENDANCE_COMPLETENESS_WINDOW_HOURS).toBe(48);
  });

  it('is incomplete once the default window has passed with no attendance recorded', () => {
    const scheduledEnd = new Date('2026-08-01T10:00:00Z');
    const now = new Date(scheduledEnd.getTime() + 49 * 60 * 60 * 1000);
    const result = evaluateAttendanceCompleteness({ scheduledEnd, hasAttendanceRecorded: false, now });
    expect(result.incomplete).toBe(true);
  });

  it('is not incomplete while still within the window', () => {
    const scheduledEnd = new Date('2026-08-01T10:00:00Z');
    const now = new Date(scheduledEnd.getTime() + 10 * 60 * 60 * 1000);
    const result = evaluateAttendanceCompleteness({ scheduledEnd, hasAttendanceRecorded: false, now });
    expect(result.incomplete).toBe(false);
  });

  it('honors a Branch-configured window override', () => {
    const scheduledEnd = new Date('2026-08-01T10:00:00Z');
    const now = new Date(scheduledEnd.getTime() + 25 * 60 * 60 * 1000);
    const result = evaluateAttendanceCompleteness({ scheduledEnd, hasAttendanceRecorded: false, now, windowHours: 24 });
    expect(result.incomplete).toBe(true);
  });
});
