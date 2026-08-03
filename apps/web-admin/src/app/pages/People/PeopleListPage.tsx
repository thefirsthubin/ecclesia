import { useState } from 'react';
import { Avatar, Badge, Card, Divider, EmptyState, ErrorState, Heading, Input, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { LifecycleStageDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { resolveDefaultPeopleQuery, usePeopleList } from './usePeopleData';

const LIFECYCLE_BADGE_STATUS: Record<LifecycleStageDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  VISITOR: 'neutral',
  FIRST_TIME_GUEST: 'info',
  FOLLOW_UP: 'warning',
  LAPSED: 'danger',
  ASSIGNED_TO_BACENTA: 'info',
  SIX_WEEKS_PARTICIPATION: 'info',
  MEMBER: 'success',
};

const LIFECYCLE_LABEL: Record<LifecycleStageDto, string> = {
  VISITOR: 'Visitor',
  FIRST_TIME_GUEST: 'First-time guest',
  FOLLOW_UP: 'Follow-up',
  LAPSED: 'Lapsed',
  ASSIGNED_TO_BACENTA: 'Assigned to Bacenta',
  SIX_WEEKS_PARTICIPATION: 'Six weeks participation',
  MEMBER: 'Member',
};

/**
 * PRD §16.1's People directory ("Search & directory" capability). Scope
 * (whole Branch vs. one Bacenta/Basonta vs. one Bacenta of a cluster) is
 * resolved from the actor's own role, not chosen by the user - see
 * `resolveDefaultPeopleQuery`'s doc comment.
 */
export function PeopleListPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [search, setSearch] = useState('');

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultPeopleQuery(state.actor);
  const query = search.trim() ? { ...baseQuery, search: search.trim() } : baseQuery;
  const peopleState = usePeopleList(state.accessToken, query);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
      <Heading level={1}>People</Heading>
      <Input label="Search by name" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. Ama Owusu" />

      {peopleState.status === 'loading' && (
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      )}

      {peopleState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load People" onRetry={peopleState.refetch} />
        </Card>
      )}

      {peopleState.status === 'success' && (
        <Card padding={6} testId="people-list-card">
          {peopleState.data.length === 0 ? (
            <EmptyState
              icon="users"
              title={search ? 'No matches' : 'No people found'}
              description={search ? `No one matches "${search}" in this scope.` : 'No Person records are visible in your current scope yet.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {peopleState.data.map((person, index) => (
                <div key={person.id}>
                  {index > 0 && <Divider />}
                  <Link to={`/people/${person.id}`}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[3],
                        paddingTop: index > 0 ? theme.spacing[3] : 0,
                      }}
                    >
                      <Avatar name={`${person.firstName} ${person.lastName}`} size="sm" />
                      <div style={{ flex: 1 }}>
                        <Text variant="bodySmall">{`${person.firstName} ${person.lastName}`}</Text>
                      </div>
                      <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage]}</Badge>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
