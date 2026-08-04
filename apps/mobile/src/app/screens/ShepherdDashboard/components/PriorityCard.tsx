import { View } from 'react-native';
import { Badge, Button, Divider, EmptyState, Heading, Text, useTheme } from '@ecclesia/ui-native';
import type { FollowUpTaskResponseDto, SilentDriftFlagResponseDto } from '@ecclesia/contracts';

import { useOpenFollowUpTasks, useSilentDriftFlags } from '../hooks/useShepherdDashboardData';
import { CardAsyncBoundary } from './CardAsyncBoundary';
import { PersonNameText } from './PersonNameText';

const MAX_ROWS = 5;

function isOverdue(dueAt: string | null): boolean {
  return dueAt !== null && new Date(dueAt).getTime() < Date.now();
}

function DriftFlagRow({ flag }: { flag: SilentDriftFlagResponseDto }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[1] }} testID={`drift-flag-row-${flag.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PersonNameText personId={flag.personId} />
        <Badge status={flag.status === 'ESCALATED' ? 'danger' : 'warning'}>{flag.status === 'ESCALATED' ? 'Escalated' : 'Silent drift'}</Badge>
      </View>
      {/* US-G3: the specific pattern, not a generic "at risk" label.
          `attendanceMissedCount` is `libs/domain/pastoral-care`'s
          `evaluateSilentDrift()` node-D output - "how many of the last
          `attendanceThreshold` Sundays were missed," always 0 for a
          flagged record (node D is only reached once node B's `attended
          >= attendanceThreshold` already passed), so the *present* count
          shown here is `attendanceThreshold - attendanceMissedCount`, not
          `attendanceMissedCount` itself. `bacentaMissedCount` is already
          framed as a "missed"/absent count, so it's used as-is. */}
      <Text variant="bodySmall" color={theme.colors.text.secondary}>
        {`${flag.attendanceThreshold - flag.attendanceMissedCount}/${flag.attendanceThreshold} Sundays present, ${flag.bacentaMissedCount}/${flag.bacentaThreshold} Bacenta meetings absent`}
      </Text>
    </View>
  );
}

function FollowUpTaskRow({ task }: { task: FollowUpTaskResponseDto }) {
  const theme = useTheme();
  const overdue = isOverdue(task.dueAt);
  return (
    <View style={{ gap: theme.spacing[1] }} testID={`follow-up-task-row-${task.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <PersonNameText personId={task.personId} />
        <Badge status={overdue ? 'danger' : task.status === 'ESCALATED' ? 'warning' : 'info'}>
          {overdue ? 'Overdue' : task.status === 'ESCALATED' ? 'Escalated' : 'Open follow-up'}
        </Badge>
      </View>
      <Text variant="bodySmall" color={theme.colors.text.secondary}>
        {task.dueAt ? `Due ${new Date(task.dueAt).toLocaleDateString()}` : 'No due date set'}
      </Text>
    </View>
  );
}

export interface PriorityCardProps {
  /** `[Stewardship gaps sprint]` Design System §4.2's "never more than
   * 5-7 items visible without a 'see all'" rule for the Priority zone -
   * this card caps at `MAX_ROWS` combined rows, so a "See all" affordance
   * was always spec'd, just never built until `FollowUpQueueScreen`
   * existed to send it to. Drift flags have no equivalent full-screen
   * destination yet (still deferred, same as the web version - see
   * `FOLLOW_UP_QUEUE_DESIGN_NOTES.md` §9), so this only ever navigates to
   * the Follow-up queue, not a combined one. Optional so this card still
   * renders standalone in tests that don't wire navigation. */
  onViewFollowUps?: () => void;
}

/**
 * Design System §4.3's Priority zone — PRD §16.2's own framing of this
 * as "the single most important screen in the product" content: active
 * Follow-up tasks (FR-PC-04) and Silent-Drift flags (FR-PC-05) for the
 * Shepherd's own Bacenta, together in one card since both answer the
 * same question ("who needs a specific pastoral action today").
 */
export function PriorityCard({ onViewFollowUps }: PriorityCardProps) {
  const theme = useTheme();
  const followUpsState = useOpenFollowUpTasks();
  const driftState = useSilentDriftFlags();

  // Both cards fetch independently (STEP 7) - if either is still
  // loading/erroring, that half of the card shows its own boundary; only
  // once both have resolved do we decide whether to show the combined
  // empty state.
  if (followUpsState.status !== 'success' || driftState.status !== 'success') {
    return (
      <CardAsyncBoundary
        state={followUpsState.status !== 'success' ? followUpsState : driftState}
        onRetry={() => {
          followUpsState.refetch();
          driftState.refetch();
        }}
        errorTitle="Couldn't load your priorities"
        skeletonLines={4}
      >
        {() => null}
      </CardAsyncBoundary>
    );
  }

  const driftFlags = driftState.data.slice(0, MAX_ROWS);
  const followUps = followUpsState.data.slice(0, MAX_ROWS - driftFlags.length);
  const isEmpty = driftFlags.length === 0 && followUps.length === 0;

  return (
    <CardAsyncBoundary state={followUpsState} onRetry={followUpsState.refetch} errorTitle="Couldn't load your priorities">
      {() => (
        <View style={{ gap: theme.spacing[3] }}>
          <Heading level={3}>Needs your attention</Heading>
          {isEmpty ? (
            <EmptyState icon="checkCircle" title="All caught up" description="No open follow-ups or drift flags right now." tone="positive" />
          ) : (
            <View style={{ gap: theme.spacing[3] }}>
              {driftFlags.map((flag, index) => (
                <View key={flag.id} style={{ gap: theme.spacing[3] }}>
                  {index > 0 && <Divider />}
                  <DriftFlagRow flag={flag} />
                </View>
              ))}
              {followUps.map((task, index) => (
                <View key={task.id} style={{ gap: theme.spacing[3] }}>
                  {(index > 0 || driftFlags.length > 0) && <Divider />}
                  <FollowUpTaskRow task={task} />
                </View>
              ))}
            </View>
          )}
          {onViewFollowUps && (
            <Button variant="tertiary" size="sm" onPress={onViewFollowUps} testId="priority-card-view-follow-ups">
              View Follow-up queue
            </Button>
          )}
        </View>
      )}
    </CardAsyncBoundary>
  );
}
