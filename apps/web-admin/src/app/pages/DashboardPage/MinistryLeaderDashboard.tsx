import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, LineChart, PageContainer, Skeleton, Text, TrendPanel, useTheme } from '@ecclesia/ui-web';
import type { AttendanceTrendResultDto, GroupActivityResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';
import { useNavigate } from '../../router/router';
import { useGatheringsList } from '../Gatherings/useGatheringsData';
import { StaffingTargetsPanel } from '../Ministry/StaffingTargetsPanel';
import { useGroupActivity, useOvercommitmentFlags, useRoster } from '../Ministry/useMinistryData';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { DashboardHeader } from './DashboardHeader';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** `[Post-Milestone D — Portal Experiences follow-up]` The Recent
 * Ministry Activity card's window - the past 30 days, the mirror image
 * of `FollowUpTaskQueuePage.tsx`'s own `calendarWindow` (next 30 days) -
 * that card is deliberately forward-looking ("what needs my attention
 * soon"), this one is backward-looking ("what happened recently"), so
 * the two never show the same Gatherings even though both can include
 * one. */
function recentActivityWindow(now: Date): { from: string; to: string } {
  const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
}

type ActivityEntry =
  | { key: string; timestamp: string; kind: 'membership'; personId: string; label: string; description: string }
  | { key: string; timestamp: string; kind: 'staffingTarget' | 'gathering'; label: string; description: string };

/** Merges the three real, separately-fetched sources into one
 * chronological list for display - a frontend-only concern, distinct
 * from `groupActivityResponseSchema`'s own deliberate choice to keep
 * them as separate typed arrays over the wire (see that schema's doc
 * comment). A `personId`-carrying `'membership'` entry is kept distinct
 * from the other two kinds so the render layer can resolve it to a real
 * name via `PersonNameText`, rather than ever showing a raw UUID. */
function buildActivityFeed(data: GroupActivityResponseDto): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    ...data.membershipChanges.map((change): ActivityEntry => ({
      key: `membership-${change.personId}-${change.startedAt}`,
      timestamp: change.endedAt ?? change.startedAt,
      kind: 'membership',
      personId: change.personId,
      label: change.endedAt ? 'Membership ended' : 'Membership started',
      description: change.reason ?? '',
    })),
    ...data.staffingTargetChanges.map((change): ActivityEntry => ({
      key: `staffing-target-${change.id}`,
      timestamp: change.createdAt,
      kind: 'staffingTarget',
      label: 'Staffing target set',
      description: `Target of ${change.targetCount}`,
    })),
    ...data.gatherings.map((gathering): ActivityEntry => ({
      key: `gathering-${gathering.id}`,
      timestamp: gathering.scheduledStart,
      kind: 'gathering',
      label: 'Gathering',
      description: gathering.type,
    })),
  ];
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** `[Milestone D — Portal Experiences, Portal 4: Basonta Leader]` Real
 * `GET /insights/attendance-trend`, `groupId`-scoped to this Basonta,
 * `gatheringCategory=BASONTA_MEETING` - the same `groupId`-narrowing
 * `useBacentaLeaderInsightsData.ts` establishes for Portal 3, reused here
 * inline (small per-page glue, this codebase's own established precedent
 * for a single-consumer fetch not worth extracting into a shared hook
 * file). Replaces the prior demo `buildMinistryAttendanceSeries()`. */
function useMinistryAttendanceTrend(accessToken: string | undefined, groupId: string | undefined): AsyncDataResult<AttendanceTrendResultDto> {
  return useAsyncData<AttendanceTrendResultDto>(
    (signal) => {
      if (!accessToken || !groupId) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ granularity: 'month', count: '6', groupId, gatheringCategory: 'BASONTA_MEETING' });
      return apiGet<AttendanceTrendResultDto>(`/insights/attendance-trend?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, groupId],
  );
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
 *
 * `[Milestone D — Portal Experiences, Portal 4: Basonta Leader]` Ministry
 * Attendance is now real too (`useMinistryAttendanceTrend`,
 * `GET /insights/attendance-trend` `groupId`-narrowed to this Basonta,
 * `gatheringCategory=BASONTA_MEETING`) - the prior demo series is
 * removed.
 *
 * `[Post-Milestone D — Portal Experiences follow-up]` Recent Ministry
 * Activity is now real too (`useGroupActivity`, `GET
 * /ministry/groups/:groupId/activity` - the disclosed backend gap this
 * milestone's own comment used to describe here, closed by
 * `GroupActivityService`). `buildActivityFeed` merges its three real
 * sources - membership changes, Staffing Target changes, and this
 * Basonta's own Gatherings - into one chronological list for the past 30
 * days; see that function's own doc comment for why the merge happens
 * only at the render layer. Deliberately still omits any
 * overcommitment-flag history - see `groupActivityResponseSchema`'s own
 * doc comment (`libs/contracts/src/lib/ministry.schemas.ts`) for why that
 * would require fabricating a timestamp that isn't persisted anywhere.
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
  const attendanceTrendState = useMinistryAttendanceTrend(accessToken, groupId);
  // Lazy initializer - see `FollowUpTaskQueuePage.tsx`'s own
  // `calendarWindow` precedent for why a plain `recentActivityWindow(new
  // Date())` call inline would recompute (and refetch) on every render.
  const [activityRange] = useState(() => recentActivityWindow(new Date()));
  const activityState = useGroupActivity(accessToken, groupId ?? '', activityRange.from, activityRange.to);

  const rosterSize = rosterState.status === 'success' ? rosterState.data.length : undefined;
  const overcommittedCount = overcommitmentState.status === 'success' ? overcommitmentState.data.length : undefined;

  if (!groupId) {
    return (
      <PageContainer maxWidth={720}>
        <ErrorState title="No Basonta assigned" description="Your account has no Basonta (Ministry Team) assigned yet - contact your Admin." onRetry={() => undefined} />
      </PageContainer>
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
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
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
          <Card padding={6} elevation={1} testId="ministry-attendance-chart-card">
            <TrendPanel
              title="Ministry attendance"
              description="Attendance at this Basonta's Gatherings"
              status={attendanceTrendState.status}
              onRetry={attendanceTrendState.refetch}
              errorTitle="Couldn't load the attendance trend"
              skeletonHeight={160}
            >
              {attendanceTrendState.status === 'success' &&
                (attendanceTrendState.data.buckets.every((bucket) => bucket.presentCount === 0) ? (
                  <EmptyState icon="trendingUp" title="No attendance recorded" description="No attendance has been recorded for this Basonta in this window yet." />
                ) : (
                  <LineChart
                    data={attendanceTrendState.data.buckets.map((bucket) => ({ label: bucket.label, value: bucket.presentCount }))}
                    height={160}
                    color={theme.colors.brand.default}
                    testId="ministry-attendance-line-chart"
                  />
                ))}
            </TrendPanel>
          </Card>

          <Card padding={6} testId="recent-ministry-activity-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Heading level={3}>Recent ministry activity</Heading>
              {activityState.status === 'loading' && <Skeleton height={20} />}
              {activityState.status === 'error' && <ErrorState title="Couldn't load recent activity" onRetry={activityState.refetch} />}
              {activityState.status === 'success' &&
                (buildActivityFeed(activityState.data).length === 0 ? (
                  <EmptyState icon="clock" title="No recent activity" description="Nothing has changed on this Basonta in the last 30 days." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                    {buildActivityFeed(activityState.data)
                      .slice(0, 5)
                      .map((entry, index) => (
                        <div key={entry.key}>
                          {index > 0 && <Divider />}
                          <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                            <Text variant="bodySmall">
                              {entry.label}
                              {entry.kind === 'membership' && (
                                <>
                                  {' — '}
                                  <PersonNameText personId={entry.personId} />
                                </>
                              )}
                              {entry.description && ` — ${entry.description}`}
                            </Text>
                            <Text variant="caption" color={theme.colors.text.secondary}>
                              {formatDateTime(entry.timestamp)}
                            </Text>
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
