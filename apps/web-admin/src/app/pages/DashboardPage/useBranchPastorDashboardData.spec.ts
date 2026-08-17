import { getCurrentWeekBounds, sumMeetingOffering, sumSundayAttendance } from './useBranchPastorDashboardData';
import type { BacentaPerformanceRow } from './useBranchPastorDashboardData';

function row(overrides: Partial<BacentaPerformanceRow> = {}): BacentaPerformanceRow {
  return {
    groupId: 'bacenta-1',
    name: 'Grace Bacenta',
    memberCount: 10,
    sundayAttendance: null,
    sundayAttendancePercent: null,
    meetingAttendance: null,
    meetingAttendancePercent: null,
    meetingOfferingMinor: null,
    ...overrides,
  };
}

describe('getCurrentWeekBounds', () => {
  it('resolves the Monday of the current week for a mid-week date (Wednesday)', () => {
    const wednesday = new Date(2026, 0, 7); // 2026-01-07 is a Wednesday
    const { startDate, endDate, startDateOnly } = getCurrentWeekBounds(wednesday);
    expect(startDateOnly).toBe('2026-01-05'); // the preceding Monday
    expect(startDate.getDay()).toBe(1);
    expect(endDate.getTime() - startDate.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('resolves back to the preceding Monday for a Sunday date, not forward to the next week', () => {
    const sunday = new Date(2026, 0, 11); // 2026-01-11 is a Sunday
    const { startDateOnly } = getCurrentWeekBounds(sunday);
    expect(startDateOnly).toBe('2026-01-05');
  });

  it('returns the same date for a Monday itself', () => {
    const monday = new Date(2026, 0, 5);
    const { startDateOnly } = getCurrentWeekBounds(monday);
    expect(startDateOnly).toBe('2026-01-05');
  });
});

describe('sumSundayAttendance', () => {
  it('sums known values and ignores nothing when every row has a real count', () => {
    expect(sumSundayAttendance([row({ sundayAttendance: 30 }), row({ sundayAttendance: 42 })])).toBe(72);
  });

  it('sums only the known values when some rows have no Gathering recorded (null)', () => {
    expect(sumSundayAttendance([row({ sundayAttendance: 30 }), row({ sundayAttendance: null })])).toBe(30);
  });

  it('returns null (not a fabricated 0) when every row is null', () => {
    expect(sumSundayAttendance([row({ sundayAttendance: null }), row({ sundayAttendance: null })])).toBeNull();
  });

  it('returns null for an empty row list', () => {
    expect(sumSundayAttendance([])).toBeNull();
  });
});

describe('sumMeetingOffering', () => {
  it('sums minor-unit amount strings as real integer arithmetic (not float)', () => {
    expect(sumMeetingOffering([row({ meetingOfferingMinor: '25000' }), row({ meetingOfferingMinor: '18000' })])).toBe('43000');
  });

  it('sums only the known values when some Bacentas have no reconciliation row (null)', () => {
    expect(sumMeetingOffering([row({ meetingOfferingMinor: '25000' }), row({ meetingOfferingMinor: null })])).toBe('25000');
  });

  it('returns null (not a fabricated "0") when every row is null', () => {
    expect(sumMeetingOffering([row({ meetingOfferingMinor: null })])).toBeNull();
  });
});
