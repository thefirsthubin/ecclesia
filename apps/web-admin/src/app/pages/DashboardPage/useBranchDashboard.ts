import type { BranchDashboardResponseDto } from '@ecclesia/contracts';

import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * `GET /insights/branch-dashboard` (FR-INS-04) — Resident Pastor's
 * whole-Branch view (Design System §4.3, `APPLICATION_SHELL_DESIGN_NOTES.md`
 * §5). Reuses an endpoint that already existed before this sprint; no new
 * backend work for this call.
 */
export function useBranchDashboard(accessToken: string | undefined): AsyncDataResult<BranchDashboardResponseDto> {
  return useAsyncData<BranchDashboardResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<BranchDashboardResponseDto>('/insights/branch-dashboard', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}
