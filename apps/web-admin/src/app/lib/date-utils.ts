const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * `[Milestone D — Portal Experiences]` The most recent Sunday (inclusive
 * of today, if today itself is a Sunday) - real, computed date math, not
 * a guessed weekday. Pass this as a trend endpoint's `endingAt` with
 * `granularity=week` (`buildTimeBuckets`'s own Monday-start convention,
 * `libs/domain/insights/src/lib/time-buckets.ts`) to always resolve the
 * Monday-Sunday week *containing* that Sunday - stable whether "today"
 * falls earlier in the same week (the coming Sunday hasn't happened yet,
 * but the query still asks for the week that will contain it once it
 * does) or later (the week already closed). First extracted from
 * `useTreasurerDashboardData.ts`, once `useAdminDashboardData.ts` needed
 * the identical "this week, anchored to its own real Sunday" window for
 * its own attendance-by-category breakdown - two genuinely independent
 * consumers, not a speculative abstraction.
 */
export function mostRecentSundayIso(now: Date): string {
  const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysSinceSunday = utcMidnight.getUTCDay(); // 0 = Sunday
  return new Date(utcMidnight.getTime() - daysSinceSunday * MILLISECONDS_PER_DAY).toISOString();
}
