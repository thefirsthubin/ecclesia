import { Avatar, Badge, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useParams } from '../../router/router';
import { GroupNameText } from './GroupNameText';
import { useGroupMembershipHistory, usePersonDetail, useRoleAssignmentHistory } from './usePeopleData';

const LIFECYCLE_LABEL: Record<string, string> = {
  VISITOR: 'Visitor',
  FIRST_TIME_GUEST: 'First-time guest',
  FOLLOW_UP: 'Follow-up',
  LAPSED: 'Lapsed',
  ASSIGNED_TO_BACENTA: 'Assigned to Bacenta',
  SIX_WEEKS_PARTICIPATION: 'Six weeks participation',
  MEMBER: 'Member',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/**
 * PRD §16.1's "Person profile view" surface: "Shows current stage,
 * current Group memberships, role history, attendance summary, giving
 * summary (permission-gated)." Attendance/giving summaries are Gatherings'
 * and Stewardship's own data respectively - out of scope for this sprint
 * (People page only), so this shows the fields People's own API actually
 * returns: profile fields, lifecycle stage, and full Group-membership +
 * Role-Assignment history (FR-PPL-07).
 */
export function PersonDetailPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const { id } = useParams<{ id: string }>();

  if (state.status !== 'authenticated') return null;

  const personState = usePersonDetail(state.accessToken, id);
  const membershipState = useGroupMembershipHistory(state.accessToken, id);
  const roleState = useRoleAssignmentHistory(state.accessToken, id);

  if (personState.status === 'loading') {
    return (
      <Card padding={6}>
        <Skeleton height={32} width="40%" />
      </Card>
    );
  }

  if (personState.status === 'error') {
    return (
      <Card padding={6}>
        <ErrorState title="Couldn't load this Person" onRetry={personState.refetch} />
      </Card>
    );
  }

  const person = personState.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 640 }}>
      <Card padding={6} testId="person-profile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
          <Avatar name={`${person.firstName} ${person.lastName}`} size="md" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
            <Heading level={1}>{`${person.firstName} ${person.lastName}`}</Heading>
            <Badge status="success">{LIFECYCLE_LABEL[person.lifecycleStage] ?? person.lifecycleStage}</Badge>
          </div>
        </div>
        <div style={{ marginTop: theme.spacing[4], display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.phone ?? 'No phone on file'}
          </Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.email ?? 'No email on file'}
          </Text>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.address ?? 'No address on file'}
          </Text>
        </div>
      </Card>

      <Card padding={6} testId="group-membership-history-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Heading level={3}>Bacenta / Basonta history</Heading>
          {membershipState.status === 'loading' && <Skeleton height={20} />}
          {membershipState.status === 'error' && <ErrorState title="Couldn't load membership history" onRetry={membershipState.refetch} />}
          {membershipState.status === 'success' &&
            (membershipState.data.length === 0 ? (
              <EmptyState title="No group history yet" />
            ) : (
              membershipState.data.map((membership, index) => (
                <div key={membership.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                      <GroupNameText groupId={membership.groupId} />
                      <Badge status={membership.endedAt ? 'neutral' : 'success'}>{membership.endedAt ? 'Past' : 'Active'}</Badge>
                    </div>
                    <Text variant="caption" color={theme.colors.text.secondary}>
                      {membership.endedAt
                        ? `${formatDate(membership.startedAt)} – ${formatDate(membership.endedAt)}`
                        : `Since ${formatDate(membership.startedAt)}`}
                      {membership.reason ? ` · ${membership.reason}` : ''}
                    </Text>
                  </div>
                </div>
              ))
            ))}
        </div>
      </Card>

      <Card padding={6} testId="role-assignment-history-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Heading level={3}>Role history</Heading>
          {roleState.status === 'loading' && <Skeleton height={20} />}
          {roleState.status === 'error' && <ErrorState title="Couldn't load role history" onRetry={roleState.refetch} />}
          {roleState.status === 'success' &&
            (roleState.data.length === 0 ? (
              <EmptyState title="No roles held yet" />
            ) : (
              roleState.data.map((assignment, index) => (
                <div key={assignment.id}>
                  {index > 0 && <Divider />}
                  <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                      <Text variant="bodySmall">{assignment.role.replace(/_/g, ' ')}</Text>
                      <Badge status={assignment.effectiveTo ? 'neutral' : 'success'}>{assignment.effectiveTo ? 'Past' : 'Active'}</Badge>
                    </div>
                    <Text variant="caption" color={theme.colors.text.secondary}>
                      {assignment.effectiveTo
                        ? `${formatDate(assignment.effectiveFrom)} – ${formatDate(assignment.effectiveTo)}`
                        : `Since ${formatDate(assignment.effectiveFrom)}`}
                    </Text>
                  </div>
                </div>
              ))
            ))}
        </div>
      </Card>
    </div>
  );
}
