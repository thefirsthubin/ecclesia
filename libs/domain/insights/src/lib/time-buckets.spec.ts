import { buildTimeBuckets } from './time-buckets';

describe('[Milestone C] buildTimeBuckets', () => {
  it('builds month buckets ending at the given date\'s own month, oldest first', () => {
    const buckets = buildTimeBuckets('month', 3, new Date('2026-08-17T10:00:00.000Z'));

    expect(buckets).toHaveLength(3);
    expect(buckets.map((b) => b.label)).toEqual(['Jun 2026', 'Jul 2026', 'Aug 2026']);
    expect(buckets[2].bucketStart.toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(buckets[2].bucketEnd.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(buckets[0].bucketStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
  });

  it('handles a month rollover across a year boundary', () => {
    const buckets = buildTimeBuckets('month', 3, new Date('2026-01-15T00:00:00.000Z'));
    expect(buckets.map((b) => b.label)).toEqual(['Nov 2025', 'Dec 2025', 'Jan 2026']);
  });

  it('builds week buckets starting on Monday, matching BankDepositConfirmation.weekStartDate\'s own convention', () => {
    // 2026-08-17 is a Monday.
    const buckets = buildTimeBuckets('week', 2, new Date('2026-08-19T12:00:00.000Z'));
    expect(buckets).toHaveLength(2);
    expect(buckets[1].bucketStart.toISOString()).toBe('2026-08-17T00:00:00.000Z');
    expect(buckets[1].bucketEnd.toISOString()).toBe('2026-08-24T00:00:00.000Z');
    expect(buckets[0].bucketStart.toISOString()).toBe('2026-08-10T00:00:00.000Z');
  });

  it('builds year buckets', () => {
    const buckets = buildTimeBuckets('year', 3, new Date('2026-08-17T00:00:00.000Z'));
    expect(buckets.map((b) => b.label)).toEqual(['2024', '2025', '2026']);
    expect(buckets[2].bucketStart.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(buckets[2].bucketEnd.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('every consecutive pair of buckets is contiguous - no gap, no overlap', () => {
    for (const granularity of ['week', 'month', 'year'] as const) {
      const buckets = buildTimeBuckets(granularity, 6, new Date('2026-08-17T00:00:00.000Z'));
      for (let i = 1; i < buckets.length; i += 1) {
        expect(buckets[i - 1].bucketEnd.toISOString()).toBe(buckets[i].bucketStart.toISOString());
      }
    }
  });
});
