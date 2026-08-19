import type { GetGivingTrendQuery, GivingTrendResultDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface GivingTrendFilter {
  granularity: GetGivingTrendQuery['granularity'];
  count: number;
  gatheringCategory?: GetGivingTrendQuery['gatheringCategory'];
}

/**
 * `[Milestone D — Portal Experiences]` Branch Treasurer Insights - `GET
 * /insights/giving-trend` (Milestone C's own read model), the first web-
 * admin consumer of this endpoint directly (every existing dashboard
 * sourced its trend charts from the composite `branch-dashboard-summary`
 * endpoint instead - see this hook's own module for why that shape can't
 * answer "Sunday vs Midweek vs Bacenta vs Basonta vs Other," which only
 * `gatheringCategory` filtering on this dedicated endpoint provides).
 * `TREASURER` is BRANCH-scoped (never COUNCIL) for
 * `stewardship.transaction.read`, so the response is always the
 * single-branch shape.
 */
export function useTreasurerInsightsData(accessToken: string | undefined, filter: GivingTrendFilter): AsyncDataResult<GivingTrendResultDto> {
  return useAsyncData<GivingTrendResultDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: filter.granularity, count: String(filter.count) });
      if (filter.gatheringCategory) params.set('gatheringCategory', filter.gatheringCategory);
      return apiGet<GivingTrendResultDto>(`/insights/giving-trend?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, filter.granularity, filter.count, filter.gatheringCategory],
  );
}

export interface TrendSummary {
  /** Sum of every bucket's `totalAmountMinor` in the current window, as a
   * decimal string - `formatAmountMinor`-ready, computed with `BigInt`
   * (real minor-unit amounts, never `Number` float summation across a
   * potentially-year-long series). */
  totalMinor: string;
  /** The most recent bucket's own total, or `null` if that bucket has no
   * data yet (never a fabricated `0`). */
  latestMinor: string | null;
  direction: 'up' | 'down' | 'flat' | null;
  /** Percentage change from the second-most-recent bucket to the most
   * recent, rounded to one decimal - `null` when there are fewer than two
   * buckets, or the prior bucket is `0` (a real percentage cannot be
   * computed against a zero base without dividing by zero). */
  growthPercent: number | null;
}

/** Real, honest period-over-period comparison - no fabricated trend when
 * the data can't support one. Exported standalone so it's directly
 * unit-testable without mocking a fetch. */
export function summarizeTrend(result: GivingTrendResultDto): TrendSummary {
  const totalMinor = result.buckets.reduce((sum, bucket) => sum + BigInt(bucket.totalAmountMinor), 0n).toString();

  if (result.buckets.length === 0) {
    return { totalMinor, latestMinor: null, direction: null, growthPercent: null };
  }

  const latest = result.buckets[result.buckets.length - 1];
  const latestMinor = latest.totalAmountMinor;

  if (result.buckets.length < 2) {
    return { totalMinor, latestMinor, direction: null, growthPercent: null };
  }

  const previous = result.buckets[result.buckets.length - 2];
  const latestValue = Number(latest.totalAmountMinor);
  const previousValue = Number(previous.totalAmountMinor);

  const direction: TrendSummary['direction'] = latestValue === previousValue ? 'flat' : latestValue > previousValue ? 'up' : 'down';
  const growthPercent = previousValue === 0 ? null : Math.round(((latestValue - previousValue) / previousValue) * 1000) / 10;

  return { totalMinor, latestMinor, direction, growthPercent };
}
