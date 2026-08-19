import { mostRecentSundayIso } from './date-utils';

describe('[Milestone D] mostRecentSundayIso', () => {
  it('resolves back to the most recent past Sunday for a mid-week date (Wednesday)', () => {
    // 2026-08-19 is a Wednesday; the most recent Sunday is 2026-08-16.
    const wednesday = new Date(Date.UTC(2026, 7, 19, 15, 0, 0));
    expect(mostRecentSundayIso(wednesday)).toBe(new Date(Date.UTC(2026, 7, 16)).toISOString());
  });

  it('resolves back to the most recent past Sunday for a Saturday date', () => {
    // 2026-08-22 is a Saturday; the most recent Sunday is still 2026-08-16.
    const saturday = new Date(Date.UTC(2026, 7, 22, 9, 0, 0));
    expect(mostRecentSundayIso(saturday)).toBe(new Date(Date.UTC(2026, 7, 16)).toISOString());
  });

  it('returns the same date (not the prior week) when today itself is a Sunday', () => {
    const sunday = new Date(Date.UTC(2026, 7, 16, 20, 0, 0));
    expect(mostRecentSundayIso(sunday)).toBe(new Date(Date.UTC(2026, 7, 16)).toISOString());
  });

  it('resolves back to the most recent past Sunday for a Monday date (the day after)', () => {
    const monday = new Date(Date.UTC(2026, 7, 17, 6, 0, 0));
    expect(mostRecentSundayIso(monday)).toBe(new Date(Date.UTC(2026, 7, 16)).toISOString());
  });
});
