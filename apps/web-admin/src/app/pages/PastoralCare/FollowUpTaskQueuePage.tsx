import { useState } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageContainer, PageHeader, RecordPicker, SectionHeader, Skeleton, Table, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn } from '@ecclesia/ui-web';
import type { FollowUpTaskResponseDto, PastoralCalendarResponseDto, SilentDriftFlagResponseDto, SilentDriftStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { Link } from '../../router/router';
import { searchGroupsForAssignment } from '../People/usePeopleData';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from './PersonNameText';
import {
  completeFollowUpTask,
  createFollowUpTask,
  escalateFollowUpTask,
  resolveDefaultFollowUpTaskQuery,
  resolveDefaultSilentDriftQuery,
  searchPeopleForEscalation,
  useFollowUpTaskQueue,
  useFollowUpTaskQueueForGroups,
  usePastoralCalendar,
  useSilentDriftFlags,
  useSilentDriftFlagsForGroups,
} from './usePastoralCareData';

const SILENT_DRIFT_STATUS_BADGE: Record<SilentDriftStatusDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  FLAGGED: 'warning',
  ESCALATED: 'danger',
  RESOLVED: 'success',
};

function formatDueDate(dueAt: string | null): string {
  return dueAt ? new Date(dueAt).toLocaleDateString() : 'No due date';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function isOverdue(task: FollowUpTaskResponseDto, now: Date): boolean {
  return task.status !== 'COMPLETED' && task.dueAt !== null && new Date(task.dueAt).getTime() < now.getTime();
}

type CalendarCounsellingEntry = PastoralCalendarResponseDto['counsellingSessions'][number];
type CalendarInteractionEntry = PastoralCalendarResponseDto['interactions'][number];

/** `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
 * "Calendar" - the next 30 days from today, a fixed window matching this
 * page's own "what needs my attention soon" framing (the Follow-up queue
 * above has no date-range control either). */
function calendarWindow(now: Date): { from: string; to: string } {
  const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  return { from: now.toISOString(), to: to.toISOString() };
}

/** Best-effort extraction of the server's actual denial/conflict reason -
 * same precedent as `GatheringsListPage.tsx`'s own `extractErrorMessage`. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * PRD §16.2's "Follow-up task queue... sorted by SLA urgency" surface
 * (ordering itself comes from `FollowUpTaskRepository.listByGroup`/
 * `listByBranch` - soonest `dueAt` first, already applied server-side).
 * See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` for the full scope reasoning,
 * including why Silent-drift flags/Pastoral notes/Poimen tracker are
 * still not part of this pass, and §4's own note on Escalate (built in
 * the `[Stewardship gaps sprint]` follow-on, once `RecordPicker` existed
 * in `libs/ui/web`).
 */
export function FollowUpTaskQueuePage() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [escalationTarget, setEscalationTarget] = useState<RecordOption | null>(null);
  const [escalateBusy, setEscalateBusy] = useState(false);
  const [escalateError, setEscalateError] = useState<string | undefined>(undefined);

  // Declared before any conditional `return` below (Rules of Hooks),
  // matching every other reveal-panel milestone this session.
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubject, setCreateSubject] = useState<RecordOption | null>(null);
  const [createAssignee, setCreateAssignee] = useState<RecordOption | null>(null);
  const [createGroupTarget, setCreateGroupTarget] = useState<RecordOption | null>(null);
  const [createDueAtOverride, setCreateDueAtOverride] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  // `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
  // Computed once via lazy `useState` initializer, not re-derived on every
  // render - a plain `calendarWindow(new Date())` call inline would
  // produce a new `from`/`to` string (and therefore a new `useAsyncData`
  // dependency) on every render, causing an infinite refetch loop.
  const [calendarRange] = useState(() => calendarWindow(new Date()));

  if (state.status !== 'authenticated') return null;

  // `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` Same
  // roles as `PersonDetailPage.tsx`'s own `canSeePrivatePastoralTools` -
  // traced against `permission-matrix.ts`: `pastoral_care.interaction.read`
  // (the Pastoral Calendar's own gating action) is held only by
  // `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` (BRANCH) and
  // `ASSISTANT_PASTOR` (CLUSTER).
  const canSeePastoralCalendar = state.actor.role === 'RESIDENT_PASTOR' || state.actor.role === 'ACTING_RESIDENT_PASTOR' || state.actor.role === 'ASSISTANT_PASTOR';
  const calendarState = usePastoralCalendar(canSeePastoralCalendar ? state.accessToken : undefined, calendarRange.from, calendarRange.to);

  // `[Branch Pastor portal]` Same "compute both, activate one" fix as
  // `PeopleListPage.tsx` - `ASSISTANT_PASTOR`'s real CLUSTER grant spans
  // every Bacenta in `clusterBacentaIds`, not just the first one the
  // single-groupId `resolveDefault*Query` functions default to. Both
  // hooks per queue are called unconditionally (Rules of Hooks); passing
  // `undefined` as the access token is this codebase's existing "don't
  // fetch" idiom, so the unused branch never makes a network call.
  const isClusterRole = state.actor.role === 'ASSISTANT_PASTOR';
  const clusterBacentaIds = state.actor.clusterBacentaIds ?? [];

  const query = resolveDefaultFollowUpTaskQuery(state.actor);
  const singleGroupQueueState = useFollowUpTaskQueue(isClusterRole ? undefined : state.accessToken, query);
  const clusterQueueState = useFollowUpTaskQueueForGroups(isClusterRole ? state.accessToken : undefined, clusterBacentaIds);
  const queueState = isClusterRole ? clusterQueueState : singleGroupQueueState;

  const silentDriftQuery = resolveDefaultSilentDriftQuery(state.actor);
  const singleGroupSilentDriftState = useSilentDriftFlags(isClusterRole ? undefined : state.accessToken, silentDriftQuery);
  const clusterSilentDriftState = useSilentDriftFlagsForGroups(isClusterRole ? state.accessToken : undefined, clusterBacentaIds);
  const silentDriftState = isClusterRole ? clusterSilentDriftState : singleGroupSilentDriftState;

  const openCreate = () => {
    setCreateSubject(null);
    setCreateAssignee(null);
    setCreateGroupTarget(null);
    setCreateDueAtOverride('');
    setCreateError(undefined);
    setCreateOpen(true);
  };
  const cancelCreate = () => {
    setCreateOpen(false);
    setCreateError(undefined);
  };
  const submitCreate = async () => {
    if (!createSubject || !createAssignee) return;
    setCreateSubmitting(true);
    setCreateError(undefined);
    try {
      await createFollowUpTask(state.accessToken, createSubject.id, {
        assignedToPersonId: createAssignee.id,
        trigger: 'MANUAL',
        groupId: createGroupTarget?.id,
        dueAtOverride: createDueAtOverride ? new Date(createDueAtOverride).toISOString() : undefined,
      });
      queueState.refetch();
      setCreateOpen(false);
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Something went wrong creating this Follow-up task.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  // `[UX Design Implementation]` Final UX Design Specification §19
  // (Phase 4 Pastoral Care workflow UI) - previously had no `catch` at
  // all, so a failed Complete (e.g. an RBAC denial, or the task having
  // moved to a state the server no longer accepts) surfaced nothing to
  // the user - the button just stopped loading with no success or error
  // signal. A toast for both outcomes, the same pattern
  // `PersonDetailPage.tsx`'s own Follow-up Task creation already
  // established for a single-click action with no dedicated form to
  // show an inline error in.
  const complete = async (taskId: string) => {
    setCompletingId(taskId);
    try {
      await completeFollowUpTask(state.accessToken, taskId);
      queueState.refetch();
      toast.show({ status: 'success', message: 'Follow-up task marked complete.' });
    } catch (error) {
      toast.show({ status: 'danger', message: extractErrorMessage(error, 'Something went wrong marking this Follow-up task complete.') });
    } finally {
      setCompletingId(null);
    }
  };

  const openEscalate = (taskId: string) => {
    setEscalatingId(taskId);
    setEscalationTarget(null);
    setEscalateError(undefined);
  };
  const cancelEscalate = () => {
    setEscalatingId(null);
    setEscalationTarget(null);
    setEscalateError(undefined);
  };
  const submitEscalate = async (taskId: string) => {
    if (!escalationTarget) return;
    setEscalateBusy(true);
    setEscalateError(undefined);
    try {
      await escalateFollowUpTask(state.accessToken, taskId, escalationTarget.id);
      queueState.refetch();
      cancelEscalate();
    } catch (error) {
      // `[UX Design Implementation]` Final UX Design Specification §19 -
      // previously unhandled (no `catch`), so a failed escalation (e.g.
      // an RBAC denial) left the form open with the button no longer
      // loading and no indication anything went wrong - matches
      // `submitCreate`'s own inline-error pattern just above.
      setEscalateError(extractErrorMessage(error, 'Something went wrong escalating this Follow-up task.'));
    } finally {
      setEscalateBusy(false);
    }
  };

  /**
   * `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 4 Pastoral Care workflow UI) - split from the prior two-column
   * (Person+status-badge, one caption cramming assignee/group/due date
   * together) shape into the explicit column set the phase brief itself
   * names: Person / Status / Assigned to / Group / Due / Actions. Same
   * underlying fields, same values, no new data - this queue's whole job
   * is "what needs my attention," and a due date buried mid-sentence in
   * a caption is harder to scan down than its own column.
   */
  const taskColumns: TableColumn<FollowUpTaskResponseDto>[] = [
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
      key: 'assignedTo',
      header: 'Assigned to',
      render: (task) => <PersonNameText personId={task.assignedToPersonId} />,
    },
    {
      key: 'group',
      header: 'Group',
      render: (task) =>
        task.groupId ? (
          <GroupNameText groupId={task.groupId} />
        ) : (
          <Text variant="caption" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
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
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (task) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={() => openEscalate(task.id)} accessibilityLabel={`Escalate Follow-up task: ${task.id}`}>
            Escalate
          </Button>
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
      ),
    },
  ];

  /**
   * `[Silent-Drift Detection Branch-wide milestone]` Read-only - no
   * Actions column, unlike `taskColumns` above; `SilentDriftFlagController`
   * exposes no mutation route at all.
   *
   * `[UX Design Implementation]` Final UX Design Specification §19 (Phase
   * 4 Pastoral Care workflow UI) - split into the explicit column set the
   * phase brief names: Person / Status / Bacenta / Attendance pattern.
   * Same fields as before, now each independently scannable instead of
   * one combined caption.
   */
  const silentDriftColumns: TableColumn<SilentDriftFlagResponseDto>[] = [
    {
      key: 'person',
      header: 'Person',
      render: (flag) => <PersonNameText personId={flag.personId} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (flag) => <Badge status={SILENT_DRIFT_STATUS_BADGE[flag.status]}>{flag.status}</Badge>,
    },
    {
      key: 'bacenta',
      header: 'Bacenta',
      render: (flag) => <GroupNameText groupId={flag.groupId} />,
    },
    {
      key: 'attendancePattern',
      header: 'Attendance pattern',
      render: (flag) => (
        <Text variant="caption" color={theme.colors.text.secondary}>
          {`Attended ${flag.attendanceThreshold - flag.attendanceMissedCount} of last ${flag.attendanceThreshold} Gatherings, `}
          {`${flag.bacentaThreshold - flag.bacentaMissedCount} of last ${flag.bacentaThreshold} Bacenta Meetings`}
          {` · Flagged ${formatDate(flag.createdAt)}`}
        </Text>
      ),
    },
  ];

  return (
    <PageContainer maxWidth={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        {/* `[UX Design Implementation]` Final UX Design Specification §19
            (Phase 4 Pastoral Care workflow UI) - `secondary`, not
            `primary`. This was the one "+ open a form" trigger button in
            the app still styled `primary` (`PeopleListPage`'s "+ New
            Person", `StewardshipPage`'s "+ Record Transaction"/"+ Request
            Expense", and every trigger on `PersonDetailPage` all use
            `secondary`, reserving `primary` for the actual in-progress
            submit action) - it also meant this button and an
            in-progress row's "Submit escalation" could both render
            `primary` at once, which the design system's own "exactly
            one Primary-styled button visible at a time" rule (§19
            principle 1) rules out. "Prominent but restrained" (the
            phase brief's own words) is exactly what `secondary` already
            means everywhere else this pattern appears. */}
        <PageHeader
          title="Pastoral Care"
          action={
            !createOpen ? (
              <Button variant="secondary" size="sm" onClick={openCreate} accessibilityLabel="Create Follow-up task">
                + Create Follow-up task
              </Button>
            ) : undefined
          }
        />

        {/* `[Follow-up Task Creation milestone]` FR-PC-03's manual/explicit
            creation path - always offered, no client-side role check. Traced
            against the real matrix, not assumed: `RESIDENT_PASTOR`/`ADMIN`
            hold no `.create` grant at all for this action, so this always
            403s for those personas - the backend's real response is what
            they see, same as every other gated action in this app. The
            subject Person's own Bacenta membership (not the acting user's)
            decides CLUSTER/OWN_GROUP scope server-side - neither constraint
            is enforced client-side. */}
        {createOpen && (
          <Card padding={6} testId="follow-up-task-create-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <RecordPicker
                label="Person"
                placeholder="Search for the Person this task concerns…"
                value={createSubject}
                onChange={setCreateSubject}
                onSearch={(searchQuery) => searchPeopleForEscalation(state.accessToken, searchQuery)}
              />
              <RecordPicker
                label="Assign to"
                placeholder="Search for who this task is assigned to…"
                value={createAssignee}
                onChange={setCreateAssignee}
                onSearch={(searchQuery) => searchPeopleForEscalation(state.accessToken, searchQuery)}
              />
              <RecordPicker
                label="Group (optional)"
                placeholder="Search for a Bacenta or Basonta…"
                value={createGroupTarget}
                onChange={setCreateGroupTarget}
                onSearch={(searchQuery) => searchGroupsForAssignment(state.accessToken, searchQuery)}
              />
              <Input
                label="Due date override (optional)"
                type="datetime-local"
                value={createDueAtOverride}
                onChange={(event) => setCreateDueAtOverride(event.target.value)}
              />
              {createError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {createError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!createSubject || !createAssignee}
                  loading={createSubmitting}
                  onClick={() => void submitCreate()}
                >
                  Confirm create
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

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
              <SectionHeader title="Follow-up tasks" />
              <Table
                testId="follow-up-task-queue-table"
                columns={taskColumns}
                data={queueState.data}
                getRowId={(task) => task.id}
                isRowExpanded={(task) => escalatingId === task.id}
                renderRowDetail={(task) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="escalate-form">
                    <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <RecordPicker
                          label="Escalate to"
                          placeholder="Search for a Person…"
                          value={escalationTarget}
                          onChange={setEscalationTarget}
                          onSearch={(searchQuery) => searchPeopleForEscalation(state.accessToken, searchQuery)}
                        />
                      </div>
                      <Button variant="primary" size="sm" disabled={!escalationTarget} loading={escalateBusy} onClick={() => void submitEscalate(task.id)}>
                        Submit escalation
                      </Button>
                      <Button variant="secondary" size="sm" onClick={cancelEscalate}>
                        Cancel
                      </Button>
                    </div>
                    {escalateError && (
                      <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                        {escalateError}
                      </Text>
                    )}
                  </div>
                )}
                emptyIcon="checkCircle"
                emptyTitle="No open Follow-up tasks"
                emptyDescription="Every Follow-up task in your scope has been completed."
                emptyTone="positive"
              />
            </div>
          </Card>
        )}

        {/* `[Silent-Drift Detection Branch-wide milestone]` FR-PC-05/§15.8.
            Read-only - `SilentDriftFlagController` exposes no mutation
            route at all (traced, not assumed), so there is no
            resolve/escalate action to offer here, unlike the Follow-up
            queue above. `resolveDefaultSilentDriftQuery` mirrors the same
            role-scoping `resolveDefaultFollowUpTaskQuery` already
            establishes, since the two actions' RBAC rows name the
            identical roles/scopes. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader title="Silent-Drift flags" />

          {silentDriftState.status === 'loading' && (
            <Card padding={6}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <Skeleton height={40} />
                <Skeleton height={40} />
              </div>
            </Card>
          )}

          {silentDriftState.status === 'error' && (
            <Card padding={6}>
              <ErrorState title="Couldn't load Silent-Drift flags" onRetry={silentDriftState.refetch} />
            </Card>
          )}

          {silentDriftState.status === 'success' && (
            <Card padding={6} testId="silent-drift-flags-card">
              <Table
                testId="silent-drift-flags-table"
                columns={silentDriftColumns}
                data={silentDriftState.data}
                getRowId={(flag) => flag.id}
                emptyIcon="checkCircle"
                emptyTitle="No Silent-Drift flags"
                emptyDescription="No Persons are currently flagged for silent drift in your scope."
                emptyTone="positive"
              />
            </Card>
          )}
        </div>

        {/* `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
            "Calendar" - `GET /pastoral-care/calendar`, the next 30 days.
            Only Counselling/Interactions render here - Follow-up tasks
            already have their own queue above, so repeating them here
            would just be a second view of the same rows. Gated to the
            same private-pastoral roles as `PersonDetailPage.tsx`'s own
            Counselling/Interactions sections - `BACENTA_LEADER`/
            `BASONTA_LEADER` never see this section at all. */}
        {canSeePastoralCalendar && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <SectionHeader title="Pastoral Calendar" description="Counselling and Interactions scheduled in the next 30 days" />

            {calendarState.status === 'loading' && (
              <Card padding={6}>
                <Skeleton height={40} />
              </Card>
            )}

            {calendarState.status === 'error' && (
              <Card padding={6}>
                <ErrorState title="Couldn't load the Pastoral Calendar" onRetry={calendarState.refetch} />
              </Card>
            )}

            {calendarState.status === 'success' && (
              <Card padding={6} testId="pastoral-calendar-card">
                {calendarState.data.counsellingSessions.length === 0 && calendarState.data.interactions.length === 0 ? (
                  <EmptyState icon="calendar" title="Nothing scheduled" description="No Counselling sessions or Interactions scheduled in the next 30 days." tone="positive" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                    {calendarState.data.counsellingSessions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="pastoral-calendar-counselling-list">
                        <Text variant="label" color={theme.colors.text.secondary}>
                          Counselling
                        </Text>
                        {calendarState.data.counsellingSessions.map((entry: CalendarCounsellingEntry) => (
                          <Link key={entry.id} to={`/people/${entry.personId}`}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                              <PersonNameText personId={entry.personId} />
                              <Text variant="caption" color={theme.colors.text.secondary}>
                                {formatDate(entry.scheduledAt)}
                              </Text>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    {calendarState.data.interactions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="pastoral-calendar-interactions-list">
                        <Text variant="label" color={theme.colors.text.secondary}>
                          Interactions
                        </Text>
                        {calendarState.data.interactions.map((entry: CalendarInteractionEntry) => (
                          <Link key={entry.id} to={`/people/${entry.personId}`}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                              <PersonNameText personId={entry.personId} />
                              <Text variant="caption" color={theme.colors.text.secondary}>
                                {entry.type}
                                {entry.scheduledAt ? ` · ${formatDate(entry.scheduledAt)}` : ''}
                              </Text>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
