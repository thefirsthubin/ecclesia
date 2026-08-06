import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Button, Divider, EmptyState, ErrorState, Heading, RecordPicker, Skeleton, Text, useTheme } from '@ecclesia/ui-native';
import type { RecordOption } from '@ecclesia/ui-native';
import type { FollowUpTaskResponseDto } from '@ecclesia/contracts';

import { useSession } from '../../lib/session';
import { PersonNameText } from '../ShepherdDashboard/components/PersonNameText';
import { useOpenFollowUpTasks } from '../ShepherdDashboard/hooks/useShepherdDashboardData';
import { completeFollowUpTask, escalateFollowUpTask, searchPeopleForEscalation } from './hooks/useFollowUpActions';

function isOverdue(task: FollowUpTaskResponseDto): boolean {
  return task.status !== 'COMPLETED' && task.dueAt !== null && new Date(task.dueAt).getTime() < Date.now();
}

/**
 * Follow-up queue — the third of the Design System §3.2 Shepherd tab bar's
 * own-screen items (Dashboard · Attendance · Follow-ups · Offering ·
 * Profile). Reachable both from `AppShell`'s real bottom tab bar and from
 * `PriorityCard`'s "View Follow-up queue" affordance
 * (`ShepherdDashboardScreen.tsx`), not a `QuickActionsRow` button —
 * `QuickActionsRow` stays scoped to NFR-PERF-01's two named critical
 * actions (Take Attendance, Record Offering), and a Follow-up queue is a
 * *list to review*, not a single time-boxed action.
 *
 * Reuses `useOpenFollowUpTasks`/`PersonNameText` from `ShepherdDashboard`
 * unmodified — the same list `PriorityCard` already shows a capped
 * preview of — rather than a second, duplicate data-fetching hook.
 *
 * `[Stewardship gaps sprint]` No more "Back" button — now that
 * `AppShell`'s real bottom tab bar exists, this screen is a top-level tab
 * destination in its own right, not a pushed sub-screen. No longer wraps
 * itself in its own `SafeAreaView` either — `AppShell` now owns the one
 * safe-area container for the whole authenticated tab area. Complete/
 * Escalate both just refetch the list in place, so there is no
 * `switchTab` call to add here (unlike Attendance Capture/Offering
 * Recording's post-save navigation).
 */
export function FollowUpQueueScreen() {
  const theme = useTheme();
  const session = useSession();
  const queueState = useOpenFollowUpTasks();

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [escalationTarget, setEscalationTarget] = useState<RecordOption | null>(null);
  const [escalateBusy, setEscalateBusy] = useState(false);

  const complete = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      await completeFollowUpTask(session.authToken, taskId);
      queueState.refetch();
    } finally {
      setCompletingId(null);
    }
  };

  const openEscalate = (taskId: string) => {
    setEscalatingId(taskId);
    setEscalationTarget(null);
  };
  const cancelEscalate = () => {
    setEscalatingId(null);
    setEscalationTarget(null);
  };
  const submitEscalate = async (taskId: string) => {
    if (!escalationTarget) return;
    setEscalateBusy(true);
    try {
      await escalateFollowUpTask(session.authToken, taskId, escalationTarget.id);
      queueState.refetch();
      cancelEscalate();
    } finally {
      setEscalateBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
        <Heading level={1}>Follow-ups</Heading>

        {queueState.status === 'loading' && (
          <View style={{ gap: theme.spacing[3] }}>
            <Skeleton height={84} radius="md" />
            <Skeleton height={84} radius="md" />
            <Skeleton height={84} radius="md" />
          </View>
        )}

        {queueState.status === 'error' && (
          <ErrorState title="Couldn't load your Follow-up tasks" onRetry={queueState.refetch} testId="follow-up-queue-error" />
        )}

        {queueState.status === 'success' &&
          (queueState.data.length === 0 ? (
            <EmptyState
              icon="checkCircle"
              title="No open Follow-up tasks"
              description="Every Follow-up task in your Bacenta has been completed."
              tone="positive"
            />
          ) : (
            <View style={{ gap: theme.spacing[4] }}>
              {queueState.data.map((task, index) => {
                const overdue = isOverdue(task);
                return (
                  <View key={task.id}>
                    {index > 0 && <Divider />}
                    <View style={{ gap: theme.spacing[2], paddingTop: index > 0 ? theme.spacing[4] : 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <PersonNameText personId={task.personId} />
                        <Badge status={task.status === 'ESCALATED' ? 'danger' : overdue ? 'danger' : 'warning'}>
                          {task.status === 'ESCALATED' ? 'Escalated' : overdue ? 'Overdue' : 'Open'}
                        </Badge>
                      </View>
                      <Text variant="bodySmall" color={theme.colors.text.secondary}>
                        {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : 'No due date set'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                        <Button variant="secondary" size="sm" onPress={() => openEscalate(task.id)} testId={`follow-up-escalate-${task.id}`}>
                          Escalate
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={completingId === task.id}
                          onPress={() => void complete(task.id)}
                          testId={`follow-up-complete-${task.id}`}
                        >
                          Complete
                        </Button>
                      </View>
                      {escalatingId === task.id && (
                        <View style={{ gap: theme.spacing[2] }}>
                          <RecordPicker
                            label="Escalate to"
                            placeholder="Search for a Person…"
                            value={escalationTarget}
                            onChange={setEscalationTarget}
                            onSearch={(query) => searchPeopleForEscalation(session.authToken, query)}
                            testId={`follow-up-escalate-picker-${task.id}`}
                          />
                          <View style={{ flexDirection: 'row', gap: theme.spacing[2] }}>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={!escalationTarget}
                              loading={escalateBusy}
                              onPress={() => void submitEscalate(task.id)}
                              testId={`follow-up-escalate-submit-${task.id}`}
                            >
                              Submit escalation
                            </Button>
                            <Button variant="secondary" size="sm" onPress={cancelEscalate} testId={`follow-up-escalate-cancel-${task.id}`}>
                              Cancel
                            </Button>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}
