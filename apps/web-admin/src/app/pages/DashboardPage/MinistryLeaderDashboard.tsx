import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Icon, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { useNavigate } from '../../router/router';
import { useGatheringsList } from '../Gatherings/useGatheringsData';
import { StaffingTargetsPanel } from '../Ministry/StaffingTargetsPanel';
import { useOvercommitmentFlags, useRoster } from '../Ministry/useMinistryData';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { DashboardHeader } from './DashboardHeader';
import { DEMO_MINISTRY_ACTIVITY, buildMinistryAttendanceSeries } from './dashboardDemoData';
import { TrendCard } from './TrendCard';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function hoursAgoLabel(hoursAgo: number): string {
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  return `${Math.round(hoursAgo / 24)}d ago`;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 1, the
 * Ministry Leader (`BASONTA_LEADER`) Web Admin dashboard - previously
 * routed to a "lives on mobile" stub alongside `BACENTA_LEADER`
 * (`DashboardPage.tsx`'s prior comment). That grouping is loosened here,
 * disclosed as a `[Design Decision]`: `BASONTA_LEADER` gets a real Web
 * Admin dashboard now (this milestone's brief explicitly asks for one,
 * and this role has real, working BRANCH... actually OWN_GROUP-scoped
 * grants for every zone below except Ministry Attendance/Recent
 * Activity), while `BACENTA_LEADER` alone keeps the mobile-only routing -
 * that role's dashboard is still PRD §16.2's own explicitly-named
 * highest-priority mobile surface, unaffected by this change.
 *
 * **Real, live data**: roster (`useRoster`), overcommitment flags
 * (`useOvercommitmentFlags`), Staffing Targets (`StaffingTargetsPanel`,
 * this sprint's own Objective 2), Upcoming Gatherings
 * (`useGatheringsList`, `ownerGroupId` = this Basonta - `BASONTA_LEADER`
 * holds `gatherings.gathering.read` at `OWN_GROUP` scope).
 * **Demo data, disclosed**: Ministry Attendance trend and Recent Ministry
 * Activity - no aggregate attendance-by-Basonta or activity-feed endpoint
 * exists, the same class of gap `dashboardDemoData.ts` already discloses
 * for the Resident Pastor dashboard's own Church Growth/Recent Activity
 * sections.
 */
export function MinistryLeaderDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;
  const groupId = state.status === 'authenticated' ? state.actor.basontaId : undefined;
  const { isCompact, isNarrow } = useDashboardBreakpoint();

  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );
  const displayName = personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : 'there';

  const rosterState = useRoster(accessToken, groupId ?? '');
  const overcommitmentState = useOvercommitmentFlags(accessToken, groupId ?? '');
  const gatheringsState = useGatheringsList(accessToken, groupId ? { ownerGroupId: groupId } : {});

  const rosterSize = rosterState.status === 'success' ? rosterState.data.length : undefined;
  const overcommittedCount = overcommitmentState.status === 'success' ? overcommitmentState.data.length : undefined;

  if (!groupId) {
    return (
      <div style={{ maxWidth: 720 }}>
        <ErrorState title="No Basonta assigned" description="Your account has no Basonta (Ministry Team) assigned yet - contact your Admin." onRetry={() => undefined} />
      </div>
    );
  }

  // `[Product Experience Sprint I]` Objective 6 - adds the `isCompact`
  // (tablet, 2-column) tier `ResidentPastorDashboard`'s own KPI grid
  // already has, so a Basonta Leader on a tablet doesn't see the same
  // abrupt 3-columns-to-1 jump every other persona dashboard had before
  // this pass.
  const kpiColumns = isNarrow ? 1 : isCompact ? 2 : 3;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1280 }}>
      <DashboardHeader displayName={displayName} openAlertCount={overcommittedCount ?? 0} />

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kpiColumns}, 1fr)`, gap: theme.spacing[4] }}>
        <Card interactive onClick={() => navigate('/ministry')} padding={5} testId="ministry-kpi-roster">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="users" size="md" color={theme.colors.brand.default} />
            <Text variant="label" color={theme.colors.text.secondary}>
              ROSTER SIZE
            </Text>
            {rosterSize === undefined ? <Skeleton height={32} width="40%" /> : <Heading level={3}>{rosterSize}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              View the full roster
            </Text>
          </div>
        </Card>
        <Card padding={5} testId="ministry-kpi-overcommitted">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="alertTriangle" size="md" color={theme.colors.status.warning.strong} />
            <Text variant="label" color={theme.colors.text.secondary}>
              OVERCOMMITTED
            </Text>
            {overcommittedCount === undefined ? <Skeleton height={32} width="40%" /> : <Heading level={3}>{overcommittedCount}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Workers serving on 4+ teams
            </Text>
          </div>
        </Card>
        <Card interactive onClick={() => navigate('/gatherings')} padding={5} testId="ministry-kpi-gatherings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
            <Icon name="calendar" size="md" color={theme.colors.brand.default} />
            <Text variant="label" color={theme.colors.text.secondary}>
              UPCOMING GATHERINGS
            </Text>
            {gatheringsState.status !== 'success' ? <Skeleton height={32} width="40%" /> : <Heading level={3}>{gatheringsState.data.length}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Review the calendar
            </Text>
          </div>
        </Card>
      </div>

      <StaffingTargetsPanel groupId={groupId} canEdit />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing[4] }}>
        <Card padding={6} testId="volunteer-availability-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Volunteer availability</Heading>
            {rosterState.status === 'loading' && <Skeleton height={20} />}
            {rosterState.status === 'error' && <ErrorState title="Couldn't load the roster" onRetry={rosterState.refetch} />}
            {rosterState.status === 'success' &&
              (rosterState.data.length === 0 ? (
                <EmptyState title="No active workers yet" description="No one is currently rostered on this Basonta." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {rosterState.data.slice(0, 5).map((member, index) => (
                    <div key={member.personId}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <PersonNameText personId={member.personId} />
                        {overcommitmentState.status === 'success' && overcommitmentState.data.some((flag) => flag.personId === member.personId) && (
                          <Badge status="warning">Overcommitted</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {rosterState.data.length > 5 && (
                    <Button variant="tertiary" size="sm" onClick={() => navigate('/ministry')}>
                      View all {rosterState.data.length}
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </Card>

        <Card padding={6} testId="upcoming-gatherings-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Upcoming Gatherings</Heading>
            {gatheringsState.status === 'loading' && <Skeleton height={20} />}
            {gatheringsState.status === 'error' && <ErrorState title="Couldn't load Gatherings" onRetry={gatheringsState.refetch} />}
            {gatheringsState.status === 'success' &&
              (gatheringsState.data.length === 0 ? (
                <EmptyState icon="calendar" title="Nothing scheduled" description="No upcoming Gatherings for this Basonta yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {gatheringsState.data.slice(0, 5).map((gathering, index) => (
                    <div key={gathering.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                        <Text variant="bodySmall">{gathering.type}</Text>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          {formatDateTime(gathering.scheduledStart)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing[4] }}>
        <TrendCard title="Ministry attendance" subtitle="Attendance at this Basonta's Gatherings" series={buildMinistryAttendanceSeries()} color={theme.colors.brand.default} testId="ministry-attendance-chart" />

        <Card padding={6} testId="recent-ministry-activity-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Recent ministry activity</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {DEMO_MINISTRY_ACTIVITY.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                    <Icon name={activity.icon} size="sm" color={activity.tone === 'success' ? theme.colors.status.success.strong : theme.colors.text.secondary} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1 }}>
                      <Text variant="bodySmall">{activity.description}</Text>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {hoursAgoLabel(activity.hoursAgo)}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
