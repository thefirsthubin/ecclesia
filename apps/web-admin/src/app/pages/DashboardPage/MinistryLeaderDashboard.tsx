import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Icon, SampleDataBadge, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
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
  const branchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const { isNarrow } = useDashboardBreakpoint();

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

  /**
   * `[Product Experience Sprint II, Phase 4]` Replaces three identical
   * `Icon + LABEL + Heading + caption` cards - the exact "generic admin
   * dashboard" pattern this sprint's own brief calls out by name - with
   * one quiet summary strip, same recipe `BranchPastorDashboard`'s KPI
   * strip already proved. Roster Size gets real visual weight (it's the
   * number a Ministry Leader's whole job centers on - can I staff this
   * team); Overcommitted and Upcoming Gatherings sit smaller beside it,
   * and Overcommitted only takes a warning color when it's actually
   * nonzero - never a fabricated threshold, the same "objective data
   * state, not invented severity" rule the Branch Pastor table already
   * follows. Not individually clickable: `Volunteer availability` and
   * `Upcoming Gatherings` (immediately below) already are the real
   * detail view for these two numbers, so a second click target here
   * would just be a duplicate path to the same place, not new
   * information architecture.
   */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1280 }}>
      <DashboardHeader displayName={displayName} openAlertCount={overcommittedCount ?? 0} branchName={branchName} />

      <Card padding={4} testId="ministry-summary-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[5], flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[2] }}>
            {rosterSize === undefined ? <Skeleton height={28} width={32} /> : <Heading level={3}>{rosterSize}</Heading>}
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              on your roster
            </Text>
          </div>
          <Divider orientation="vertical" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
            <Text as="span" variant="numericTabular" color={overcommittedCount ? theme.colors.status.warning.strong : theme.colors.text.primary}>
              {overcommittedCount === undefined ? '—' : overcommittedCount}
            </Text>
            <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
              overcommitted
            </Text>
          </div>
          <Divider orientation="vertical" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[1] }}>
            <Text as="span" variant="numericTabular">
              {gatheringsState.status === 'success' ? gatheringsState.data.length : '—'}
            </Text>
            <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
              upcoming Gatherings
            </Text>
          </div>
        </div>
      </Card>

      <StaffingTargetsPanel groupId={groupId} canEdit />

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: theme.spacing[4] }}>
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

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: theme.spacing[4] }}>
        <TrendCard title="Ministry attendance" subtitle="Attendance at this Basonta's Gatherings" series={buildMinistryAttendanceSeries()} color={theme.colors.brand.default} testId="ministry-attendance-chart" />

        <Card padding={6} testId="recent-ministry-activity-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <Heading level={3}>Recent ministry activity</Heading>
              <SampleDataBadge testId="recent-ministry-activity-sample-badge" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {DEMO_MINISTRY_ACTIVITY.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                    {/* `[Dashboard Visual Redesign]` Icon-in-tinted-circle -
                        same row treatment as `UpcomingEventsTimeline`/
                        `RecentActivityTimeline`, applied in place. */}
                    <div
                      aria-hidden
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        flexShrink: 0,
                        borderRadius: theme.radius.full,
                        backgroundColor: activity.tone === 'success' ? theme.colors.status.success.background : theme.colors.border.subtle,
                      }}
                    >
                      <Icon name={activity.icon} size="sm" color={activity.tone === 'success' ? theme.colors.status.success.strong : theme.colors.text.secondary} />
                    </div>
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
