import type { GroupDashboardResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

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
