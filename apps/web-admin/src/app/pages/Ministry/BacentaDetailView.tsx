import { useState } from 'react';
import { Badge, Card, EmptyState, ErrorState, PageContainer, PageHeader, Skeleton, Table, Tabs, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn, TabItem } from '@ecclesia/ui-web';
import type { FollowUpTaskResponseDto, GatheringResponseDto, GatheringStatusDto, GroupLifecycleStatusDto, GroupResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { useGatheringsList } from '../Gatherings/useGatheringsData';
import { useFollowUpTaskQueue } from '../PastoralCare/usePastoralCareData';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { LIFECYCLE_BADGE_STATUS, LIFECYCLE_LABEL } from '../People/lifecycleLabels';
import { usePeopleList } from '../People/usePeopleData';

const LIFECYCLE_STATUS_LABEL: Record<GroupLifecycleStatusDto, string> = {
  ACTIVE: 'Active',
  SPLITTING: 'Splitting',
  MERGING: 'Merging',
  ARCHIVED: 'Archived',
};

const GATHERING_STATUS_BADGE: Record<GatheringStatusDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  SCHEDULED: 'info',
  CANCELLED: 'danger',
  COMPLETED: 'success',
};

const GATHERING_STATUS_LABEL: Record<GatheringStatusDto, string> = {
  SCHEDULED: 'Scheduled',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function formatDueDate(dueAt: string | null): string {
  return dueAt ? new Date(dueAt).toLocaleDateString() : 'No due date';
}

/** Same overdue rule and Status/Due presentation `FollowUpTaskQueuePage.tsx`
 * already established, applied here instead of the raw `task.status` enum
 * value this tab previously rendered directly. */
function isOverdue(task: FollowUpTaskResponseDto, now: Date): boolean {
  return task.status !== 'COMPLETED' && task.dueAt !== null && new Date(task.dueAt).getTime() < now.getTime();
}

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI) - Bacenta (`PASTORAL_CARE` Group) detail, the
 * genuinely new surface this phase's "Bacenta detail" scope item asks
 * for. `GroupDetailPage` renders this instead of `BasontaRosterView` once
 * it resolves the routed Group's `type`.
 *
 * Three relationships shown, each backed by an existing, already-scoped
 * endpoint this phase adds no new backend capability for:
 * - Members: `GET /people?groupId=` (`usePeopleList`, People phase)
 * - Gatherings: `GET /gatherings?ownerGroupId=` (`useGatheringsList`,
 *   Gatherings phase)
 * - Follow-up: `GET /pastoral-care/follow-up-tasks?groupId=`
 *   (`useFollowUpTaskQueue`, Pastoral Care phase)
 * None of these are new fetches invented for this page - all three hooks
 * already existed for their own domain's list screens; this view is the
 * first caller to filter each of them down to one Group.
 *
 * **Leadership is deliberately not a tab here.** Same limitation
 * `BasontaDirectoryPage.tsx`'s own doc comment discloses: no group-scoped
 * Role Assignment endpoint exists (`GET /people/:personId/role-assignments`
 * is per-person only), so there is nothing real to render without an
 * N+1 fetch across every current member. The Overview tab below links out
 * to each member's own Profile -> Role history instead of fabricating a
 * leadership list.
 *
 * **Members here is read-only.** Assigning/reassigning a Person to this
 * Bacenta already has a real entry point - `PersonDetailPage`'s "Assign to
 * Bacenta/Basonta" control (`assignGroupMembership`,
 * `POST /people/:personId/group-memberships`) - and duplicating that form
 * here (a second "add member" control calling the same endpoint) is
 * exactly the kind of workflow duplication this phase's brief forbids.
 * The one-active-Bacenta rule and the reassignment-reason requirement are
 * both enforced server-side by that same existing endpoint either way.
 */
export function BacentaDetailView({ group }: { group: GroupResponseDto }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const [activeTab, setActiveTab] = useState('overview');

  const membersState = usePeopleList(accessToken, { groupId: group.id });
  const gatheringsState = useGatheringsList(accessToken, { ownerGroupId: group.id });
  const followUpState = useFollowUpTaskQueue(accessToken, { groupId: group.id });

  const memberColumns: TableColumn<PersonResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (person) => (
        <Link to={`/people/${person.id}`}>
          <Text variant="bodySmall">{`${person.firstName} ${person.lastName}`}</Text>
        </Link>
      ),
    },
    {
      key: 'lifecycleStage',
      header: 'Lifecycle stage',
      render: (person) => <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage]}</Badge>,
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (person) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {person.phone ?? person.email ?? 'No contact on file'}
        </Text>
      ),
    },
  ];

  const gatheringColumns: TableColumn<GatheringResponseDto>[] = [
    { key: 'type', header: 'Type', render: (gathering) => <Text variant="bodySmall">{gathering.type}</Text> },
    {
      key: 'scheduledStart',
      header: 'Scheduled',
      render: (gathering) => <Text variant="bodySmall">{formatDateTime(gathering.scheduledStart)}</Text>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (gathering) => <Badge status={GATHERING_STATUS_BADGE[gathering.status]}>{GATHERING_STATUS_LABEL[gathering.status]}</Badge>,
    },
  ];

  const followUpColumns: TableColumn<FollowUpTaskResponseDto>[] = [
    {
      key: 'person',
      header: 'Person',
      render: (task) => (
        <Link to={`/people/${task.personId}`}>
          <PersonNameText personId={task.personId} />
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (task) => {
        const overdue = isOverdue(task, new Date());
        return (
          <Badge status={task.status === 'ESCALATED' ? 'danger' : overdue ? 'danger' : 'warning'}>
            {task.status === 'ESCALATED' ? 'Escalated' : overdue ? 'Overdue' : 'Open'}
          </Badge>
        );
      },
    },
    {
      key: 'due',
      header: 'Due',
      render: (task) => (
        <Text variant="bodySmall" color={isOverdue(task, new Date()) ? theme.colors.status.danger.strong : theme.colors.text.primary}>
          {formatDueDate(task.dueAt)}
        </Text>
      ),
    },
  ];

  const overviewContent = (
    <div data-testid="bacenta-overview-card" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
        <Badge status="neutral">Bacenta</Badge>
        <Badge status={group.lifecycleStatus === 'ACTIVE' ? 'success' : group.lifecycleStatus === 'ARCHIVED' ? 'neutral' : 'warning'}>
          {LIFECYCLE_STATUS_LABEL[group.lifecycleStatus]}
        </Badge>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {`Meets: ${group.meetingSchedule ?? 'Not set'}${group.meetingLocation ? ` at ${group.meetingLocation}` : ''}`}
        </Text>
        {group.category && (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {`Category: ${group.category}`}
          </Text>
        )}
      </div>
      <Text variant="caption" color={theme.colors.text.secondary}>
        Leadership for this Bacenta isn&apos;t listed here - there is no Group-scoped Role Assignment lookup in the backend today. Check a specific
        member&apos;s own Profile → Role history tab to see whether they hold a Bacenta Leader assignment.
      </Text>
    </div>
  );

  const membersContent = (
    <div data-testid="bacenta-members-card" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      <Text variant="caption" color={theme.colors.text.secondary}>
        Current members only. To add, reassign, or view a Person&apos;s full Bacenta/Basonta history, open their Profile and use &quot;Assign to
        Bacenta/Basonta&quot;.
      </Text>
      {membersState.status === 'loading' && <Skeleton height={20} />}
      {membersState.status === 'error' && <ErrorState title="Couldn't load members" onRetry={membersState.refetch} />}
      {membersState.status === 'success' && (
        <Table
          testId="bacenta-members-table"
          columns={memberColumns}
          data={membersState.data}
          getRowId={(person) => person.id}
          emptyTitle="No current members"
          emptyDescription="No one is currently assigned to this Bacenta."
        />
      )}
    </div>
  );

  const gatheringsContent = (
    <div data-testid="bacenta-gatherings-card" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
        <Text variant="caption" color={theme.colors.text.secondary}>
          Gatherings owned by this Bacenta.
        </Text>
        <Link to="/gatherings">
          <Text variant="bodySmall">View in Gatherings →</Text>
        </Link>
      </div>
      {gatheringsState.status === 'loading' && <Skeleton height={20} />}
      {gatheringsState.status === 'error' && <ErrorState title="Couldn't load Gatherings" onRetry={gatheringsState.refetch} />}
      {gatheringsState.status === 'success' && (
        <Table
          testId="bacenta-gatherings-table"
          columns={gatheringColumns}
          data={gatheringsState.data}
          getRowId={(gathering) => gathering.id}
          emptyTitle="No Gatherings yet"
          emptyDescription="This Bacenta doesn't own any Gatherings yet."
        />
      )}
    </div>
  );

  const followUpContent = (
    <div data-testid="bacenta-followup-card" style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
        <Text variant="caption" color={theme.colors.text.secondary}>
          Follow-up tasks scoped to this Bacenta.
        </Text>
        <Link to="/pastoral-care">
          <Text variant="bodySmall">View in Pastoral Care →</Text>
        </Link>
      </div>
      {followUpState.status === 'loading' && <Skeleton height={20} />}
      {followUpState.status === 'error' && <ErrorState title="Couldn't load Follow-up tasks" onRetry={followUpState.refetch} />}
      {followUpState.status === 'success' &&
        (followUpState.data.length === 0 ? (
          <EmptyState icon="checkCircle" title="No Follow-up tasks" description="No open Follow-up tasks are scoped to this Bacenta." />
        ) : (
          <Table testId="bacenta-followup-table" columns={followUpColumns} data={followUpState.data} getRowId={(task) => task.id} emptyTitle="No Follow-up tasks" />
        ))}
    </div>
  );

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'members', label: 'Members', content: membersContent },
    { id: 'gatherings', label: 'Gatherings', content: gatheringsContent },
    { id: 'followup', label: 'Follow-up', content: followUpContent },
  ];

  return (
    <PageContainer maxWidth={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <PageHeader title={group.name} />
        <Card padding={6} testId="bacenta-detail-card">
          <Tabs testId="bacenta-detail-tabs" tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />
        </Card>
      </div>
    </PageContainer>
  );
}
