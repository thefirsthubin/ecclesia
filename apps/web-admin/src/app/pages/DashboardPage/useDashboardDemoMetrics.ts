import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';
import {
  DEMO_BACENTA_LEADERBOARD,
  DEMO_KPIS,
  DEMO_UPCOMING_EVENTS,
  buildGrowthSeries,
  type BacentaLeaderboardEntry,
  type GrowthSeriesPoint,
  type KpiDatum,
  type UpcomingEventDatum,
} from './dashboardDemoData';

export interface DashboardDemoMetrics {
  kpis: KpiDatum[];
  upcomingEvents: UpcomingEventDatum[];
  growth: { attendance: GrowthSeriesPoint[]; membership: GrowthSeriesPoint[]; giving: GrowthSeriesPoint[] };
  leaderboard: BacentaLeaderboardEntry[];
}

/**
 * Built on the same `useAsyncData` every real Web Admin data hook uses
 * (`useBranchDashboard.ts`, `usePeopleData.ts`, etc.) even though this one
 * resolves static demo data rather than fetching - two reasons: (1) it
 * keeps every dashboard section on one consistent loading/error/success
 * contract, so `Skeleton`/`ErrorState` render identically whether a
 * section's data is real or demo, and (2) it means swapping this for a
 * real `apiGet('/insights/dashboard-summary', ...)` call later touches
 * only this function's body, not any component that consumes it. The
 * short artificial delay is deliberate, not a bug - a premium dashboard
 * should show its own polished loading state at least once rather than
 * only ever being visible mid-flash, and it mirrors the real latency a
 * live endpoint would actually have.
 */
export function useDashboardDemoMetrics(): AsyncDataResult<DashboardDemoMetrics> {
  return useAsyncData<DashboardDemoMetrics>(
    (signal) =>
      new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve({ kpis: DEMO_KPIS, upcomingEvents: DEMO_UPCOMING_EVENTS, growth: buildGrowthSeries(), leaderboard: DEMO_BACENTA_LEADERBOARD });
        }, 350);
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('aborted', 'AbortError'));
        });
      }),
    [],
  );
}
