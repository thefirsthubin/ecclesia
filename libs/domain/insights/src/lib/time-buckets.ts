/**
 * `[Milestone C: Portal Read Models + Analytics]` Phase 2's single
 * shared time-bucketing utility - the one primitive every new
 * giving/attendance/membership read-model in this milestone builds on,
 * replacing what would otherwise be eight separate, hand-rolled date-math
 * blocks. Generalizes the one bucketing function that already existed in
 * this codebase before this milestone
 * (`apps/api/src/modules/insights/services/branch-dashboard-summary.service.ts`'s
 * private `lastSixMonthBoundaries`, hardcoded to exactly 6 UTC calendar
 * months) to three granularities and a caller-supplied count/end date,
 * using the exact same native `Date.UTC` arithmetic that function already
 * established - no date library is introduced (none exists anywhere in
 * this codebase today, and this milestone's own audit confirmed that).
 *
 * Every boundary is `[start, end)` - inclusive start, exclusive end - the
 * same convention every existing date-range query in this codebase
 * already uses (`FinancialTransactionRepository.sumVerifiedAmountForBranch`,
 * `AttendanceRecordRepository.countPresentInWindow`).
 */

export type TimeBucketGranularity = 'week' | 'month' | 'year';

export interface TimeBucket {
  /** Inclusive start, UTC boundary. */
  bucketStart: Date;
  /** Exclusive end (the following bucket's own start). */
  bucketEnd: Date;
  /** A short, human-readable label for this bucket (e.g. "Aug 2026" for
   * a month bucket, "2026-08-17" for a week bucket's start date, "2026"
   * for a year bucket) - display-only, never parsed back. */
  label: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_WEEK = 7 * MILLISECONDS_PER_DAY;

/** The Monday-starting UTC week containing `date` - matches
 * `BankDepositConfirmation.weekStartDate`'s own established "the Monday
 * that week begins" convention (`db/schema.prisma`'s own doc comment on
 * that field), so a week-granularity trend and the existing weekly
 * reconciliation view agree on what a "week" means. */
function startOfUtcWeek(date: Date): Date {
  const utcMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const isoWeekday = new Date(utcMidnight).getUTCDay() || 7; // Monday=1 ... Sunday=7
  return new Date(utcMidnight - (isoWeekday - 1) * MILLISECONDS_PER_DAY);
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Builds `count` consecutive `[start, end)` buckets of the given
 * `granularity`, oldest first, with the last bucket ending at (and
 * therefore covering) `endingAt`'s own bucket - the direct generalization
 * of `lastSixMonthBoundaries(now)`'s "boundaries[boundaries.length - 1]
 * is always 'this month'" contract, now for any granularity/count/end
 * date. `count` must be a positive integer; `granularity` must be one of
 * `'week' | 'month' | 'year'` - both already validated by the calling
 * contract's own Zod schema before this function ever sees them, so this
 * function trusts its inputs the same way every other pure `libs/domain`
 * function in this codebase trusts its own validated caller.
 */
export function buildTimeBuckets(granularity: TimeBucketGranularity, count: number, endingAt: Date = new Date()): TimeBucket[] {
  const buckets: TimeBucket[] = [];

  if (granularity === 'week') {
    const endWeekStart = startOfUtcWeek(endingAt);
    for (let i = count - 1; i >= 0; i -= 1) {
      const bucketStart = new Date(endWeekStart.getTime() - i * MILLISECONDS_PER_WEEK);
      const bucketEnd = new Date(bucketStart.getTime() + MILLISECONDS_PER_WEEK);
      buckets.push({ bucketStart, bucketEnd, label: formatIsoDate(bucketStart) });
    }
    return buckets;
  }

  if (granularity === 'month') {
    for (let i = count - 1; i >= 0; i -= 1) {
      const bucketStart = new Date(Date.UTC(endingAt.getUTCFullYear(), endingAt.getUTCMonth() - i, 1));
      const bucketEnd = new Date(Date.UTC(endingAt.getUTCFullYear(), endingAt.getUTCMonth() - i + 1, 1));
      buckets.push({
        bucketStart,
        bucketEnd,
        label: `${MONTH_LABELS[bucketStart.getUTCMonth()]} ${bucketStart.getUTCFullYear()}`,
      });
    }
    return buckets;
  }

  // 'year'
  for (let i = count - 1; i >= 0; i -= 1) {
    const year = endingAt.getUTCFullYear() - i;
    const bucketStart = new Date(Date.UTC(year, 0, 1));
    const bucketEnd = new Date(Date.UTC(year + 1, 0, 1));
    buckets.push({ bucketStart, bucketEnd, label: String(year) });
  }
  return buckets;
}
