import { Card, ErrorState, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { useBacentaLeaderDashboardData } from './useBacentaLeaderDashboardData';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Same `[start, end)` -> inclusive-end-date display convention every
 * other Portal dashboard's own `formatWeekRangeLabel` establishes. */
function formatWeekRangeLabel(fromIso: string, toIso: string): string {
  const start = new Date(fromIso);
  const end = new Date(new Date(toIso).getTime() - MILLISECONDS_PER_DAY);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `Week of ${startLabel} – ${endLabel}`;
}

/**
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]` Dashboard -
 * previously routed to a "lives on mobile" stub. PRD §16.2 still names the
 * *mobile* Shepherd's dashboard the product's single most important
 * screen - this Web Admin dashboard is a genuinely new, additional
 * surface for the same role, not a replacement for it.
 *
 * **Real, live data throughout** (`useBacentaLeaderDashboardData`): total
 * Bacenta members, Sunday attendance, Bacenta meeting attendance, and
 * Bacenta giving - the exact four items Portal 3's spec names, each
 * scoped to this leader's own Bacenta (`actor.bacentaId`), no fabricated
 * or demo data anywhere on this page.
 */
export function BacentaLeaderDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const groupId = state.status === 'authenticated' ? state.actor.bacentaId : undefined;
  const { isCompact } = useDashboardBreakpoint();

  const dataState = useBacentaLeaderDashboardData(accessToken, groupId);
  const weekContext = dataState.status === 'success' ? formatWeekRangeLabel(dataState.data.from, dataState.data.to) : 'This week';

  const metricGridStyle = {
    display: 'grid',
    gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing[3],
  };

  if (!groupId) {
    return (
      <PageContainer maxWidth={720}>
        <ErrorState title="No Bacenta assigned" description="Your account has no Bacenta assigned yet - contact your Admin." onRetry={() => undefined} />
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context={`${branchName} · ${weekContext}`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Your Bacenta" description={weekContext} />
          {dataState.status === 'loading' && (
            <Card padding={6}>
              <Skeleton height={120} />
            </Card>
          )}
          {dataState.status === 'error' && (
            <Card padding={6}>
              <ErrorState title="Couldn't load your Bacenta's dashboard" onRetry={dataState.refetch} />
            </Card>
          )}
          {dataState.status === 'success' && (
            <div style={metricGridStyle} data-testid="bacenta-leader-metrics-grid">
              <MetricCard label="Bacenta Members" value={String(dataState.data.memberCount)} context="Total on your Bacenta" testId="metric-bacenta-members" />
              <MetricCard label="Sunday Attendance" value={String(dataState.data.sundayAttendance.buckets[0]?.presentCount ?? 0)} context={weekContext} testId="metric-sunday-attendance" />
              <MetricCard label="Bacenta Meeting Attendance" value={String(dataState.data.bacentaMeetingAttendance.buckets[0]?.presentCount ?? 0)} context={weekContext} testId="metric-bacenta-meeting-attendance" />
              <MetricCard
                label="Bacenta Giving"
                value={dataState.data.giving.buckets[0] ? formatAmountMinor(dataState.data.giving.buckets[0].totalAmountMinor, 'GHS') : null}
                context={weekContext}
                testId="metric-bacenta-giving"
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
