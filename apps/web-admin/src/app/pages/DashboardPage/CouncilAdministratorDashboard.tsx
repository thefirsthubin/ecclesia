import { Badge, Button, Card, Divider, Heading, Icon, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';
import type { GroupResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { useNavigate } from '../../router/router';
import { AlertPriorityCard } from './AlertPriorityCard';
import { ChurchPulseCard } from './ChurchPulseCard';
import { DashboardHeader } from './DashboardHeader';
import { RecentActivityCard } from './RecentActivityCard';
import { DEMO_COUNCIL_BRANCHES } from './dashboardDemoData';
import { useBranchDashboard } from './useBranchDashboard';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

const STATUS_LABEL: Record<string, string> = { thriving: 'Thriving', healthy: 'Healthy', attention: 'Needs attention', atRisk: 'At risk' };

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 1, the Council
 * Administrator Web Admin dashboard.
 *
 * `[Design Decision, disclosed]` Mapped to `ADMIN`, not `COUNCIL_OVERSEER`
 * - `nav-items.ts`'s own comment calls `COUNCIL_OVERSEER` "this codebase's
 * 'Council Administrator' role name," but `permission-matrix.ts` grants
 * `COUNCIL_OVERSEER` **zero** ALLOW rows anywhere (`roles.ts`'s own doc
 * comment: "Council Overseer is a Horizon 3 role"). Building this
 * dashboard against that role would mean every real fetch below 403s -
 * the opposite of "engineering completion." `ADMIN` is this deployment's
 * actual administrator-with-real-permissions role (Branch-wide People/
 * Ministry/Insights read access, `AdminInsightsView`'s own precedent at
 * `/insights`) and had no `/dashboard` branch at all before this change.
 * See `DASHBOARD_REDESIGN_NOTES.md`'s Milestone 11 addendum for the full
 * reasoning; flagged here rather than silently decided, consistent with
 * this project's standing practice for any non-cited judgment call.
 *
 * **Real, live data**: Church Health (Church Pulse, `useBranchDashboard`
 * - the same Branch-wide endpoint `AdminInsightsView` already calls for
 * this role), Alerts (`AlertPriorityCard`, `readOnly` - `ADMIN` holds
 * `insights.alert.read` but not `.resolve`, same precedent
 * `AdminInsightsView` established), Recent Activity, and two real BRANCH
 * counts (total People, total Basontas). **Demo data, disclosed and
 * clearly labeled as a Horizon 3 preview**: Multi-Branch Overview/Branch
 * Comparison - PRD §7.3 places Council consolidation at Horizon 3, and no
 * second Branch or multi-branch endpoint exists anywhere in this
 * codebase (`dashboardDemoData.ts`'s own doc comment on
 * `DEMO_COUNCIL_BRANCHES`).
 */
export function CouncilAdministratorDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;
  const { isNarrow } = useDashboardBreakpoint();

  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );
  const displayName = personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : 'there';

  const dashboardState = useBranchDashboard(accessToken);
  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];
  const openAlertCount = alerts.filter((alert) => alert.status === 'OPEN').length;

  const peopleState = useAsyncData<PersonResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto[]>('/people', { authToken: accessToken, signal });
    },
    [accessToken],
  );
  const ministriesState = useAsyncData<GroupResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<GroupResponseDto[]>('/groups?type=MINISTRY', { authToken: accessToken, signal });
    },
    [accessToken],
  );

  const kpiColumns = isNarrow ? 1 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1280 }}>
      <DashboardHeader displayName={displayName} openAlertCount={openAlertCount} />

      <ChurchPulseCard
        status={dashboardState.status}
        pulseScore={dashboardState.status === 'success' ? dashboardState.data.pulseScore : undefined}
        onRetry={dashboardState.refetch}
      />

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiColumns}, 1fr)`, gap: theme.spacing[4] }}>
        <Card interactive onClick={() => navigate('/people')} padding={5} testId="council-kpi-members">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="users" size="md" color={theme.colors.brand.default} />
            <Text variant="label" color={theme.colors.text.secondary}>
              TOTAL MEMBERS
            </Text>
            {peopleState.status !== 'success' ? <Skeleton height={32} width="40%" /> : <Heading level={3}>{peopleState.data.length}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              This Branch
            </Text>
          </div>
        </Card>
        <Card interactive onClick={() => navigate('/ministry')} padding={5} testId="council-kpi-staffing">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="clipboardList" size="md" color={theme.colors.brand.default} />
            <Text variant="label" color={theme.colors.text.secondary}>
              STAFFING
            </Text>
            {ministriesState.status !== 'success' ? <Skeleton height={32} width="40%" /> : <Heading level={3}>{ministriesState.data.length}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Basontas (Ministry Teams)
            </Text>
          </div>
        </Card>
        <Card interactive onClick={() => navigate('/insights')} padding={5} testId="council-kpi-alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="alertTriangle" size="md" color={theme.colors.status.warning.strong} />
            <Text variant="label" color={theme.colors.text.secondary}>
              OPEN ALERTS
            </Text>
            <Heading level={3}>{openAlertCount}</Heading>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Across the whole Branch
            </Text>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing[4] }}>
        <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} readOnly />
        <RecentActivityCard status={dashboardState.status} alerts={alerts} onRetry={dashboardState.refetch} />
      </div>

      <Card padding={6} testId="council-multi-branch-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div>
            <Heading level={3}>Multi-Branch overview</Heading>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Preview - Council-wide consolidation is Horizon 3 (PRD §7.3); this deployment has one real Branch today
            </Text>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {DEMO_COUNCIL_BRANCHES.map((branch, index) => {
              const band = getChurchPulseBand(branch.pulseScore);
              return (
                <div key={branch.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                      <Text variant="bodySmall">{branch.name}</Text>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {`${branch.memberCount} members · Pulse ${Math.round(branch.pulseScore)}`}
                      </Text>
                    </div>
                    <Badge status={branch.status === 'thriving' || branch.status === 'healthy' ? 'success' : branch.status === 'attention' ? 'warning' : 'danger'}>
                      {STATUS_LABEL[branch.status] ?? band.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

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
  );
}
