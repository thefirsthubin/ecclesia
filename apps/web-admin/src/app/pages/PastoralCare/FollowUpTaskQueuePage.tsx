import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { FollowUpTaskResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from './PersonNameText';
import { completeFollowUpTask, resolveDefaultFollowUpTaskQuery, useFollowUpTaskQueue } from './usePastoralCareData';

function formatDueDate(dueAt: string | null): string {
  return dueAt ? new Date(dueAt).toLocaleDateString() : 'No due date';
}

function isOverdue(task: FollowUpTaskResponseDto, now: Date): boolean {
  return task.status !== 'COMPLETED' && task.dueAt !== null && new Date(task.dueAt).getTime() < now.getTime();
}

/**
 * PRD §16.2's "Follow-up task queue... sorted by SLA urgency" surface
 * (ordering itself comes from `FollowUpTaskRepository.listByGroup`/
 * `listByBranch` - soonest `dueAt` first, already applied server-side).
 * See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` for the full scope reasoning,
 * including why Escalate/Silent-drift flags/Pastoral notes/Poimen tracker
 * are not part of this pass.
 */
export function FollowUpTaskQueuePage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [completingId, setCompletingId] = useState<string | null>(null);

  if (state.status !== 'authenticated') return null;

  const query = resolveDefaultFollowUpTaskQuery(state.actor);
  const queueState = useFollowUpTaskQueue(state.accessToken, query);

  const complete = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      await completeFollowUpTask(state.accessToken, taskId);
      queueState.refetch();
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
      <Heading level={1}>Pastoral Care</Heading>

      {queueState.status === 'loading' && (
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      )}

      {queueState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load the Follow-up task queue" onRetry={queueState.refetch} />
        </Card>
      )}

      {queueState.status === 'success' && (
        <Card padding={6} testId="follow-up-task-queue-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Follow-up tasks</Heading>
            {queueState.data.length === 0 ? (
              <EmptyState icon="checkCircle" title="No open Follow-up tasks" description="Every Follow-up task in your scope has been completed." tone="positive" />
            ) : (
              queueState.data.map((task, index) => {
                const overdue = isOverdue(task, new Date());
                return (
                  <div key={task.id}>
                    {index > 0 && <Divider />}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing[3],
                        paddingTop: index > 0 ? theme.spacing[3] : 0,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                          <Text variant="bodySmall" color={theme.colors.text.secondary}>
                            For:
                          </Text>
                          <Link to={`/people/${task.personId}`}>
                            <PersonNameText personId={task.personId} />
                          </Link>
                          <Badge status={task.status === 'ESCALATED' ? 'danger' : overdue ? 'danger' : 'warning'}>
                            {task.status === 'ESCALATED' ? 'Escalated' : overdue ? 'Overdue' : 'Open'}
                          </Badge>
                        </div>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          Assigned to <PersonNameText personId={task.assignedToPersonId} />
                          {task.groupId ? (
                            <>
                              {' · '}
                              <GroupNameText groupId={task.groupId} />
                            </>
                          ) : null}
                          {' · Due '}
                          {formatDueDate(task.dueAt)}
                        </Text>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={completingId === task.id}
                        onClick={() => void complete(task.id)}
                        accessibilityLabel={`Mark Follow-up task complete: ${task.id}`}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
