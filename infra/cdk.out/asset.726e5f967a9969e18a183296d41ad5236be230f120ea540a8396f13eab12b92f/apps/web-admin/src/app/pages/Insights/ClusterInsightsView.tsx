import { useState } from 'react';
import { Button, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { AlertPriorityCard } from '../DashboardPage/AlertPriorityCard';
import { ChurchPulseCard } from '../DashboardPage/ChurchPulseCard';
import { RecentActivityCard } from '../DashboardPage/RecentActivityCard';
import { GroupNameText } from '../People/GroupNameText';
import { useGroupName } from '../People/usePeopleData';
import { useClusterDashboard } from './useInsightsData';

/**
 * Assistant Pastor's cluster drill-down (PRD §16.6/Design System §3.3).
 * Unlike Pastoral Care/Gatherings' identical-shaped `[Design Decision]`
 * simplification ("default to `clusterBacentaIds[0]`, the first Bacenta
 * only" - no picker component existed to do better), this view can offer
 * a real picker: the actor's full `clusterBacentaIds` list is already on
 * `ActorContext`, so every Bacenta in the cluster is one client-side
 * `Button` chip away, no new picker component needed. Selecting a chip
 * re-fetches `GET /insights/cluster-dashboard/:groupId` for that Bacenta -
 * still a single-Bacenta-at-a-time drill-down, not the true ranked
 * multi-Bacenta list US-G2 asks for (the backend itself has no other
 * shape to offer - see `INSIGHTS_PAGE_DESIGN_NOTES.md`), just a faster way
 * to move between them than re-typing a groupId.
 */
export function ClusterInsightsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const clusterBacentaIds = state.status === 'authenticated' ? (state.actor.clusterBacentaIds ?? []) : [];
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(clusterBacentaIds[0]);

  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const dashboardState = useClusterDashboard(accessToken, selectedGroupId);
  // `ChurchPulseCard.scopeLabel` is a plain string (it's interpolated
  // directly into a `Heading`'s text content), so the selected Bacenta's
  // name is resolved here via the same `useGroupName` hook `GroupNameText`
  // itself wraps, rather than passed as JSX.
  const groupNameState = useGroupName(accessToken, selectedGroupId ?? '');
  const scopeLabel = selectedGroupId && groupNameState.status === 'success' ? groupNameState.data.name : 'this Bacenta';
  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];

  if (clusterBacentaIds.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
        <ChurchPulseCard status="error" onRetry={() => undefined} scopeLabel="your cluster" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        {clusterBacentaIds.map((groupId) => (
          <Button
            key={groupId}
            variant={selectedGroupId === groupId ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedGroupId(groupId)}
          >
            <GroupNameText groupId={groupId} />
          </Button>
        ))}
      </div>

      <ChurchPulseCard
        status={dashboardState.status}
        pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
        onRetry={dashboardState.refetch}
        scopeLabel={scopeLabel}
      />
      <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} />
      <RecentActivityCard status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
    </div>
  );
}
