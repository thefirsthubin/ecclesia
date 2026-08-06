import { useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { AlertPriorityCard } from './AlertPriorityCard';
import { ChurchPulseCard } from './ChurchPulseCard';
import { RecentActivityCard } from './RecentActivityCard';
import { useBranchDashboard } from './useBranchDashboard';

/**
 * The Resident Pastor's Branch-wide dashboard — this sprint's fully-built
 * "first production screen" (`APPLICATION_SHELL_DESIGN_NOTES.md` §1/§5).
 * Zone order matches Design System §4.2 ("same order both platforms"):
 * Priority, Primary metric, Quick actions (embedded per-row in Priority
 * here — Resolve), Recent activity. The Notifications zone is the top
 * bar's `NotificationBell` (wired in `AppShell`), fed by this same alerts
 * payload rather than duplicated on the page.
 */
export function ResidentPastorDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const dashboardState = useBranchDashboard(accessToken);

  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
      <ChurchPulseCard
        status={dashboardState.status}
        pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
        onRetry={dashboardState.refetch}
      />
      <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} />
      <RecentActivityCard status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
    </div>
  );
}
