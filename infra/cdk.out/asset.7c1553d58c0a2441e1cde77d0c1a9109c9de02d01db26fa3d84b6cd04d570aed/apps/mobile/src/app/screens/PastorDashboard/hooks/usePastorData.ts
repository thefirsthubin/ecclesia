import type { BranchDashboardResponseDto, GroupDashboardResponseDto, GroupResponseDto, ResolveAlertInput } from '@ecclesia/contracts';

import { apiGet, apiPatch } from '../../../lib/api-client';
import { useActorSession } from '../../../lib/session';
import { useAsyncData } from '../../ShepherdDashboard/hooks/useAsyncData';
import type { AsyncDataResult } from '../../ShepherdDashboard/hooks/useAsyncData';

/**
 * Resident Pastor (`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`) data hooks
 * - shared across all three Resident Pastor screens (Dashboard/Alerts/
 * Branch), the same cross-screen reuse pattern `useMinistryData.ts`/
 * `useFinanceData.ts` already established. Both roles are `BRANCH`-scoped
 * for every action here (`ACTING_RESIDENT_PASTOR`'s rules are generated
 * verbatim from `RESIDENT_PASTOR`'s - `permission-matrix.ts`'s own
 * bottom-of-file comment), so `useActorSession()` is all that's needed -
 * no group-scoped session hook like `useMinistrySession` required.
 */

/** FR-INS-04's whole-Branch dashboard - the Dashboard tab's primary
 * content, and (per the established "Alert inbox: embedded per-dashboard"
 * decision already used for the Shepherd's own `useBacentaDashboard`) the
 * Alerts tab's data source too, via its own `alerts` field - there is no
 * separate `GET /insights/alerts` list endpoint (see `AlertController`'s
 * own doc comment: single-Alert `GET`/`PATCH` only). */
export function useBranchDashboard(): AsyncDataResult<BranchDashboardResponseDto> {
  const session = useActorSession();
  return useAsyncData(
    (signal) => apiGet<BranchDashboardResponseDto>('/insights/branch-dashboard', { authToken: session.authToken, signal }),
    [session.authToken],
  );
}

export function resolveAlert(authToken: string, alertId: string, status: ResolveAlertInput['status']): Promise<unknown> {
  return apiPatch(`/insights/alerts/${alertId}/resolve`, { status }, { authToken });
}

/** Every Bacenta in the Branch (`GET /groups?type=PASTORAL_CARE`,
 * `people.group.read` at `BRANCH` scope) - the Branch tab's drill-down
 * list. There is no distinct "Cluster" Group type in this schema
 * (`GROUP_TYPE_VALUES` is only `PASTORAL_CARE`/`MINISTRY` -
 * `people.schemas.ts`), so "Cluster/Branch" is modeled as this
 * Branch-wide Bacenta list plus the Branch Pulse header above it, not a
 * literal list-of-clusters this schema has no way to produce. See
 * `MOBILE_PERSONAS_DESIGN_NOTES.md`. */
export function useBacentaGroups(): AsyncDataResult<GroupResponseDto[]> {
  const session = useActorSession();
  return useAsyncData(
    (signal) => apiGet<GroupResponseDto[]>('/groups?type=PASTORAL_CARE', { authToken: session.authToken, signal }),
    [session.authToken],
  );
}

/** One Bacenta's own dashboard (`GET /insights/bacenta-dashboard/:groupId`,
 * `insights.bacenta_dashboard.read` at `BRANCH` scope for this role) -
 * called lazily, only once a row in the Branch tab is expanded, not
 * upfront for every Bacenta in the Branch. Fetching every Bacenta's pulse
 * score unconditionally on screen load would be an unbounded N+1 request
 * burst for a Branch with many Bacentas; on-demand drill-down is the same
 * "single-Bacenta drill-down, not a true multi-Bacenta ranked list" shape
 * `groupDashboardResponseSchema`'s own doc comment already describes this
 * endpoint as. */
export function useBacentaDashboardById(groupId: string | null): AsyncDataResult<GroupDashboardResponseDto | null> {
  const session = useActorSession();
  return useAsyncData(
    (signal) =>
      groupId
        ? apiGet<GroupDashboardResponseDto>(`/insights/bacenta-dashboard/${groupId}`, { authToken: session.authToken, signal })
        : Promise.resolve(null),
    [groupId, session.authToken],
  );
}
