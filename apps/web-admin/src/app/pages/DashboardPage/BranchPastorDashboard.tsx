import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Icon, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import { useNavigate } from '../../router/router';
import { useClusterDashboard } from '../Insights/useInsightsData';
import { GroupNameText } from '../People/GroupNameText';
import { useGroupName } from '../People/usePeopleData';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { resolveDefaultFollowUpTaskQuery, useFollowUpTaskQueue } from '../PastoralCare/usePastoralCareData';
import { AlertPriorityCard } from './AlertPriorityCard';
import { ChurchPulseCard } from './ChurchPulseCard';
import { DashboardHeader } from './DashboardHeader';
import { DEMO_PRAYER_REQUESTS, DEMO_UPCOMING_EVENTS } from './dashboardDemoData';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

function daysFromNowLabel(daysFromNow: number): string {
  if (daysFromNow === 0) return 'Today';
  if (daysFromNow === 1) return 'Tomorrow';
  return `In ${daysFromNow} days`;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 1, the Branch
 * Pastor Web Admin dashboard - mapped to `ASSISTANT_PASTOR`
 * (`Ecclesia_Design_System_UX_Foundation_v1.0.md` §2.0's own mapping
 * note: "Branch Pastor" isn't a named PRD/RBAC role, "Assistant Pastor"
 * is the nearest cited persona). Previously no `DashboardPage.tsx` branch
 * at all - the Assistant Pastor's real cluster drill-down
 * (`ClusterInsightsView`) only lived at `/insights`, not `/dashboard`.
 *
 * **Real, live data**: Branch Health/Church Pulse and Follow-ups reuse
 * exactly the same endpoints `ClusterInsightsView`/`FollowUpTaskQueuePage`
 * already call for this role (`useClusterDashboard`,
 * `useFollowUpTaskQueue` + `resolveDefaultFollowUpTaskQuery`) - a
 * Bacenta-at-a-time drill-down via the same chip selector
 * `ClusterInsightsView` established, not a new ranked multi-Bacenta list
 * (the backend has no other shape to offer - `INSIGHTS_PAGE_DESIGN_NOTES.md`).
 * Ministries reuses `GET /groups?type=MINISTRY`
 * (`people.group.read` grants `ASSISTANT_PASTOR` `CLUSTER` scope).
 * **Demo data, disclosed**: Attendance Trends/Gatherings (reuses
 * `dashboardDemoData.ts`'s existing `DEMO_UPCOMING_EVENTS` - `ASSISTANT_PASTOR`
 * holds no `gatherings.gathering.read` row at all yet, a pre-existing gap
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` already discloses) and Prayer Requests
 * (`DEMO_PRAYER_REQUESTS` - no prayer-request model exists anywhere in
 * this codebase).
 */
export function BranchPastorDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personId = state.status === 'authenticated' ? state.actor.personId : undefined;
  const clusterBacentaIds = state.status === 'authenticated' ? (state.actor.clusterBacentaIds ?? []) : [];
  const { isNarrow } = useDashboardBreakpoint();

  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(clusterBacentaIds[0]);

  const personState = useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!personId) return Promise.reject(new Error('not authenticated yet'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [personId, accessToken],
  );
  const displayName = personState.status === 'success' ? `${personState.data.firstName} ${personState.data.lastName}` : 'there';

  const dashboardState = useClusterDashboard(accessToken, selectedGroupId);
  const groupNameState = useGroupName(accessToken, selectedGroupId ?? '');
  const scopeLabel = selectedGroupId && groupNameState.status === 'success' ? groupNameState.data.name : 'this Bacenta';
  const alerts = dashboardState.status === 'success' ? dashboardState.data.alerts : [];
  const openAlertCount = alerts.filter((alert) => alert.status === 'OPEN').length;

  const followUpQuery = resolveDefaultFollowUpTaskQuery({ role: 'ASSISTANT_PASTOR', clusterBacentaIds });
  const followUpState = useFollowUpTaskQueue(accessToken, followUpQuery);
  const openFollowUps = followUpState.status === 'success' ? followUpState.data.filter((task) => task.status === 'OPEN') : undefined;

  const ministriesState = useAsyncData<{ id: string; name: string }[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<{ id: string; name: string }[]>('/groups?type=MINISTRY', { authToken: accessToken, signal });
    },
    [accessToken],
  );

  if (clusterBacentaIds.length === 0) {
    return (
      <div style={{ maxWidth: 720 }}>
        <ChurchPulseCard status="error" onRetry={() => undefined} scopeLabel="your cluster" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5], maxWidth: 1280 }}>
      <DashboardHeader displayName={displayName} openAlertCount={openAlertCount} />

      <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        {clusterBacentaIds.map((groupId) => (
          <Button key={groupId} variant={selectedGroupId === groupId ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedGroupId(groupId)}>
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

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing[4] }}>
        <AlertPriorityCard status={dashboardState.status} alerts={alerts} accessToken={accessToken} onResolved={dashboardState.refetch} onRetry={dashboardState.refetch} />

        <Card padding={6} testId="branch-pastor-followups-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Heading level={3}>Follow-ups</Heading>
              {openFollowUps !== undefined && <Badge status={openFollowUps.length > 0 ? 'warning' : 'success'}>{openFollowUps.length} open</Badge>}
            </div>
            {followUpState.status === 'loading' && <Skeleton height={20} />}
            {followUpState.status === 'error' && <ErrorState title="Couldn't load Follow-up tasks" onRetry={followUpState.refetch} />}
            {followUpState.status === 'success' &&
              (openFollowUps && openFollowUps.length === 0 ? (
                <EmptyState icon="checkCircle" title="No open follow-ups" description="Every follow-up in this Bacenta has been handled." tone="positive" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {(openFollowUps ?? []).slice(0, 4).map((task, index) => (
                    <div key={task.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                        <PersonNameText personId={task.personId} />
                      </div>
                    </div>
                  ))}
                  <Button variant="tertiary" size="sm" onClick={() => navigate('/pastoral-care')}>
                    View all follow-ups
                  </Button>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: theme.spacing[4] }}>
        <Card padding={6} testId="branch-pastor-ministries-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Ministries</Heading>
            {ministriesState.status === 'loading' && <Skeleton height={20} />}
            {ministriesState.status === 'error' && <ErrorState title="Couldn't load Ministries" onRetry={ministriesState.refetch} />}
            {ministriesState.status === 'success' &&
              (ministriesState.data.length === 0 ? (
                <EmptyState title="No Basontas yet" description="No Ministry teams have been created yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {ministriesState.data.slice(0, 5).map((group, index) => (
                    <div key={group.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                        <Text variant="bodySmall">{group.name}</Text>
                      </div>
                    </div>
                  ))}
                  <Button variant="tertiary" size="sm" onClick={() => navigate('/ministry')}>
                    View all
                  </Button>
                </div>
              ))}
          </div>
        </Card>

        <Card padding={6} testId="branch-pastor-gatherings-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Upcoming Gatherings</Heading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {DEMO_UPCOMING_EVENTS.slice(0, 4).map((event, index) => (
                <div key={event.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
                    <Icon name={event.icon} size="sm" color={theme.colors.brand.default} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                      <Text variant="bodySmall">{event.title}</Text>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {`${daysFromNowLabel(event.daysFromNow)} · ${event.time}`}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card padding={6} testId="branch-pastor-prayer-requests-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Heading level={3}>Prayer requests</Heading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {DEMO_PRAYER_REQUESTS.map((request, index) => (
              <div key={request.id}>
                {index > 0 && <Divider />}
                <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                  <Text variant="bodySmall">{`${request.requesterName} (${request.groupName}) — ${request.request}`}</Text>
                  <Text variant="caption" color={theme.colors.text.secondary}>
                    {`${request.hoursAgo}h ago`}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
        <Button variant="secondary" size="sm" onClick={() => navigate('/pastoral-care')}>
          Review follow-ups
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate('/ministry')}>
          Review ministries
        </Button>
        <Button variant="secondary" size="sm" onClick={() => navigate('/insights')}>
          Open full cluster view
        </Button>
      </div>
    </div>
  );
}
