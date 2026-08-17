import type { GroupDashboardResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface BacentaPulseScore {
  groupId: string;
  score: number;
  computedAt: string;
}

/**
 * `GET /insights/cluster-dashboard/:groupId` (FR-INS-04, Assistant
 * Pastor's cluster drill-down - PRD §16.6/Design System §3.3's "Assistant
 * Pastor cluster dashboard," one of the two named Web Admin Insights
 * surfaces). A near-identical twin of `useBranchDashboard`
 * (`DashboardPage/useBranchDashboard.ts`), just parameterized by
 * `groupId` and pointed at the cluster route instead - see
 * `INSIGHTS_PAGE_DESIGN_NOTES.md` for why this is a single-Bacenta
 * drill-down, not a true ranked multi-Bacenta list (the backend itself
 * has no other shape to offer - `GroupDashboardResourceContextGuard`'s own
 * doc comment).
 */
export function useClusterDashboard(accessToken: string | undefined, groupId: string | undefined): AsyncDataResult<GroupDashboardResponseDto> {
  return useAsyncData<GroupDashboardResponseDto>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated or no Bacenta selected'));
      return apiGet<GroupDashboardResponseDto>(`/insights/cluster-dashboard/${groupId}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId],
  );
}

/**
 * `[Branch Pastor portal, Insights rebuild]` "Which Bacentas are healthy?"
 * - the one comparison `ClusterInsightsView`'s single-Bacenta-at-a-time
 * picker could never answer (see that component's own doc comment on why
 * a true ranked multi-Bacenta list isn't backed by its own endpoint).
 * Same `Promise.all` + per-Bacenta `/insights/cluster-dashboard/:groupId`
 * fetch `useClusterAlerts` (`DashboardPage/useBranchPastorDashboardData.ts`)
 * already established for alerts, applied to the identical response's
 * `pulseScore` field instead - not a new endpoint, the same real call
 * this actor's CLUSTER grant already reaches once per Bacenta, sorted
 * highest-first so the healthiest and weakest Bacentas are both visible
 * without scrolling.
 */
export function useBacentaPulseScores(accessToken: string | undefined, clusterBacentaIds: string[]): AsyncDataResult<BacentaPulseScore[]> {
  return useAsyncData<BacentaPulseScore[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (clusterBacentaIds.length === 0) return [];
      const opts = { authToken: accessToken, signal };
      const perBacenta = await Promise.all(
        clusterBacentaIds.map((groupId) =>
          apiGet<GroupDashboardResponseDto>(`/insights/cluster-dashboard/${groupId}`, opts).then(
            (dashboard): BacentaPulseScore => ({ groupId, score: dashboard.pulseScore.score, computedAt: dashboard.pulseScore.computedAt }),
          ),
        ),
      );
      return perBacenta.sort((a, b) => b.score - a.score);
    },
    [accessToken, clusterBacentaIds.join(',')],
  );
}
