import { Button, Card, ErrorState, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from '../../router/router';
import { AlertPriorityCard } from './AlertPriorityCard';
import { ChurchPulseCard } from './ChurchPulseCard';
import { RecentActivityCard } from './RecentActivityCard';
import { useAdminDashboardData } from './useAdminDashboardData';
import { useBranchDashboard } from './useBranchDashboard';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Same `[start, end)` -> inclusive-end-date display convention
 * `BranchTreasurerDashboard.tsx`'s own `formatWeekRangeLabel` establishes -
 * duplicated here (both under 10 lines, both anchored to a different
 * source hook's own `from`/`to`) rather than extracted, matching this
 * codebase's "small per-page glue, not worth extracting" precedent. */
function formatWeekRangeLabel(fromIso: string, toIso: string): string {
  const start = new Date(fromIso);
  const end = new Date(new Date(toIso).getTime() - MILLISECONDS_PER_DAY);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `Week of ${startLabel} – ${endLabel}`;
}

/**
 * `[Milestone D — Portal Experiences]` Branch Administrator (`ADMIN`)
 * Dashboard - Portal 2 spec: "Sunday attendance, Bacenta attendance,
 * Basonta attendance, registered members, active members, inactive
 * members. Use real membership and attendance read models." Renamed
 * from `SuperAdministratorDashboard` - that name collided in meaning
 * with `SYSTEM_ADMINISTRATOR` (a different role entirely, gaining its
 * own dashboard in a later portal), even though this component has
 * always rendered for `ADMIN` ("Branch Administrator" -
 * `nav-items.ts`'s own `roleLabel`).
 *
 * **Real, live data throughout**: the six-metric grid
 * (`useAdminDashboardData` - `GET /insights/membership-trend` +
 * `GET /insights/attendance-trend` x3, see that hook's own doc comment),
 * Church Pulse (`useBranchDashboard`, unchanged), Alerts
 * (`AlertPriorityCard`, `readOnly` - `ADMIN` holds `insights.alert.read`
 * but not `.resolve`), and Recent Activity (unchanged). The prior
 * dashboard's demo-data "Multi-Branch overview" section (`DEMO_COUNCIL_BRANCHES`)
 * is removed entirely - Council-wide comparison is Portal 7's own surface
 * (a genuinely COUNCIL-scoped role), not a fabricated preview on a
 * BRANCH-scoped Administrator's own dashboard.
 */
export function BranchAdministratorDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const { isNarrow } = useDashboardBreakpoint();

  const dashboardState = useBranchDashboard(accessToken);
  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];

  const adminDataState = useAdminDashboardData(accessToken);
  const weekContext = adminDataState.status === 'success' ? formatWeekRangeLabel(adminDataState.data.from, adminDataState.data.to) : 'This week';

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: isNarrow ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing[3],
  };

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context={`${branchName} · ${weekContext}`} />

        <ChurchPulseCard
          status={dashboardState.status}
          pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
          onRetry={dashboardState.refetch}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Membership & Attendance" description={weekContext} />
          {adminDataState.status === 'loading' && (
            <Card padding={6}>
              <Skeleton height={120} />
            </Card>
          )}
          {adminDataState.status === 'error' && (
            <Card padding={6}>
              <ErrorState title="Couldn't load membership and attendance data" onRetry={adminDataState.refetch} />
            </Card>
          )}
          {adminDataState.status === 'success' && (
            <div style={metricGridStyle} data-testid="admin-metrics-grid">
              <MetricCard
                label="Registered Members"
                value={String(adminDataState.data.membership.snapshot.registeredPeopleCount)}
                context="Branch-wide"
                testId="metric-registered-members"
              />
              <MetricCard
                label="Active Members"
                value={String(adminDataState.data.membership.snapshot.activeMembersCount)}
                context={`Attended Sunday in the last ${adminDataState.data.membership.snapshot.activeMemberWindowWeeks} weeks`}
                testId="metric-active-members"
              />
              <MetricCard
                label="Inactive Members"
                value={String(adminDataState.data.membership.snapshot.inactiveMembersCount)}
                context="Registered but not recently attending"
                tone={adminDataState.data.membership.snapshot.inactiveMembersCount > 0 ? 'attention' : 'neutral'}
                testId="metric-inactive-members"
              />
              <MetricCard
                label="Sunday Attendance"
                value={String(adminDataState.data.sundayAttendance.buckets[0]?.presentCount ?? 0)}
                context={weekContext}
                testId="metric-sunday-attendance"
              />
              <MetricCard
                label="Bacenta Attendance"
                value={String(adminDataState.data.bacentaAttendance.buckets[0]?.presentCount ?? 0)}
                context={weekContext}
                testId="metric-bacenta-attendance"
              />
              <MetricCard
                label="Basonta Attendance"
                value={String(adminDataState.data.basontaAttendance.buckets[0]?.presentCount ?? 0)}
                context={weekContext}
                testId="metric-basonta-attendance"
              />
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: theme.spacing[4] }}>
          <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} readOnly />
          <RecentActivityCard status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
        </div>

        <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={() => navigate('/people')}>
            Manage People
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/configuration')}>
            Configuration
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/insights')}>
            Open full Insights view
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
