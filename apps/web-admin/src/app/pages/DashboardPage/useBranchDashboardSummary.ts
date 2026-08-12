import type { BranchDashboardSummaryResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `[Resident Pastor Dashboard - real Members/Attendance/Giving data
 * milestone]` `GET /insights/branch-dashboard-summary` - real Members
 * count/trend, Attendance count/trend, Giving total/trend, and the
 * Attendance/Membership/Giving 6-month growth series, replacing exactly
 * those fields' previous `useDashboardDemoMetrics` source on
 * `ResidentPastorDashboard`. Same `useBranchDashboard.ts` shape - a plain
 * `useAsyncData` wrapper, nothing new to learn here.
 */
export function useBranchDashboardSummary(accessToken: string | undefined): AsyncDataResult<BranchDashboardSummaryResponseDto> {
  return useAsyncData<BranchDashboardSummaryResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<BranchDashboardSummaryResponseDto>('/insights/branch-dashboard-summary', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}
