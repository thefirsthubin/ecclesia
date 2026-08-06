import { EmptyState, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { AlertPriorityCard } from '../DashboardPage/AlertPriorityCard';
import { ChurchPulseCard } from '../DashboardPage/ChurchPulseCard';
import { RecentActivityCard } from '../DashboardPage/RecentActivityCard';
import { ResidentPastorDashboard } from '../DashboardPage/ResidentPastorDashboard';
import { useBranchDashboard } from '../DashboardPage/useBranchDashboard';
import { ClusterInsightsView } from './ClusterInsightsView';

/**
 * The `/insights` nav entry (Design System §3.1's persistent sidebar,
 * distinct from `/dashboard`'s landing page - PRD §16.6's own "Key
 * surfaces" table names "Resident Pastor's church-wide dashboard" as an
 * Insights capability even though it is *also* the Application Shell's
 * default landing screen; Design System §3.3's traceability table
 * confirms both: "Insights | Resident Pastor dashboard, Assistant Pastor
 * cluster dashboard." Those are the two named Web Admin Insights
 * surfaces this sprint builds - see `INSIGHTS_PAGE_DESIGN_NOTES.md` for
 * why a Shepherd's own-Bacenta view and the H2 weight-configuration panel
 * are not part of it.
 */
export function InsightsPage() {
  const { state } = useAuth();

  if (state.status !== 'authenticated') return null;

  const role = state.actor.role;

  if (role === 'RESIDENT_PASTOR' || role === 'ACTING_RESIDENT_PASTOR') {
    // Same underlying capability, same component as the `/dashboard`
    // landing screen (`ResidentPastorDashboard`) - reused directly rather
    // than reimplemented, since both routes serve the identical
    // Branch-wide read+resolve experience for this role.
    return <ResidentPastorDashboard />;
  }

  if (role === 'ADMIN') {
    return <AdminInsightsView />;
  }

  if (role === 'ASSISTANT_PASTOR') {
    return <ClusterInsightsView />;
  }

  if (role === 'BACENTA_LEADER' || role === 'BASONTA_LEADER') {
    return (
      <EmptyState
        icon="home"
        title="Your Bacenta pulse view lives on mobile"
        description="Design System §3.3 places the Shepherd's Bacenta pulse view on the mobile app, not Web Admin. Open the Ecclesia mobile app to see it."
      />
    );
  }

  return (
    <EmptyState
      icon="clock"
      title="Insights — not available for this role"
      description="Your role does not have an Insights view in this release."
    />
  );
}

/**
 * `permission-matrix.ts` grants ADMIN `insights.branch_dashboard.read`
 * and `insights.alert.read`, both BRANCH-scoped, but *not*
 * `insights.alert.resolve` (PRD §17.3's Insights row: Admin gets "R"
 * only) - configuration authority does not imply act/dismiss authority
 * over a pastoral alert, the same separation already established for
 * `pastoral_care.notes.*` and Stewardship's zero ADMIN rows. Reuses
 * `useBranchDashboard` (identical endpoint to the Resident Pastor's own
 * view) but passes `readOnly` to `AlertPriorityCard` rather than
 * reusing `ResidentPastorDashboard` wholesale, which would render a
 * Resolve button Admin cannot actually use.
 */
function AdminInsightsView() {
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
      <AlertPriorityCard
        status={dashboardState.status}
        alerts={alerts}
        accessToken={accessToken}
        onResolved={dashboardState.refetch}
        onRetry={dashboardState.refetch}
        readOnly
      />
      <RecentActivityCard status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
    </div>
  );
}
