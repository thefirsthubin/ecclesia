import { useState } from 'react';
import { Badge, Button, Card, ErrorState, Input, PageContainer, PageHeader, RecordPicker, SectionHeader, Select, Skeleton, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn } from '@ecclesia/ui-web';
import type { GatheringResponseDto, GatheringStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { searchGroupsForAssignment } from '../People/usePeopleData';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { AttendanceCompletenessBadge } from './AttendanceCompletenessBadge';
import { AttendanceReviewPanel } from './AttendanceReviewPanel';
import { createGathering, nextGatheringStatusOptions, resolveDefaultGatheringsQuery, updateGathering, useGatheringsList } from './useGatheringsData';

const STATUS_BADGE_STATUS: Record<GatheringStatusDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  SCHEDULED: 'info',
  CANCELLED: 'danger',
  COMPLETED: 'success',
};

const STATUS_LABEL: Record<GatheringStatusDto, string> = {
  SCHEDULED: 'Scheduled',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** `[UX Design Implementation]` Final UX Design Specification §19 (Phase
 * 6 Gatherings workflow UI) - the Historical table's Date column: a plain
 * date, no time, matching the phase brief's own "Historical Gatherings
 * should prioritize: date... " wording (not "date/time", unlike the
 * Upcoming table's own list) - once a Gathering is past, its exact start
 * time matters far less than which day it happened. */
function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** Best-effort extraction of the server's actual denial/conflict reason
 * (`AllExceptionsFilter`'s `{ message: string | string[] }` body) - same
 * precedent as `PersonDetailPage.tsx`'s own `extractErrorMessage`. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

/** `<input type="datetime-local">` edits/displays in the browser's local
 * wall-clock time with no timezone suffix (`YYYY-MM-DDTHH:mm`) - neither
 * the API's `z.string().datetime()` wire format (UTC, `Z`-suffixed) nor
 * `GatheringResponseDto`'s own ISO strings. These two helpers are the
 * standard, unavoidable conversion between the two - not a business rule
 * of any kind. */
function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

/** A Gathering is "past" once its window for recording attendance has
 * closed - `scheduledEnd` when set, otherwise `scheduledStart` as the
 * closest available proxy (same fallback `libs/domain/gatherings`'s own
 * `evaluateAttendanceCompleteness` effectively applies by only measuring
 * a window when `scheduledEnd` exists at all). */
function isPast(gathering: GatheringResponseDto, now: Date): boolean {
  const reference = gathering.scheduledEnd ?? gathering.scheduledStart;
  return new Date(reference).getTime() < now.getTime();
}

/**
 * PRD §16.4's "Gathering calendar... upcoming and past Gatherings,
 * filterable by type and Group" surface, plus an inline
 * attendance-completeness indicator per past Gathering (§16.4's separate
 * "Attendance completeness report" surface, folded into the same list -
 * see `AttendanceCompletenessBadge`'s own doc comment for why). See
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` for full scope reasoning, including
 * why Group filtering isn't built this pass and why Attendance
 * Capture/Visitor Intake aren't on this page at all.
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 6
 * Gatherings workflow UI) - the single flat list is now two Tables
 * (Upcoming/Historical), each with the explicit column set the phase
 * brief itself names for that context - "use visual hierarchy rather than
 * creating unnecessary navigation," so this stays one route/one page, not
 * a tab or second screen. Both read from the exact same `useGatheringsList`
 * fetch, split client-side by the same `isPast()` this page already used
 * for the completeness badge - no new query, no new backend capability.
 * Historical rows also get a new "View attendance" action
 * (`AttendanceReviewPanel`, §19 decision) - a genuinely new surface, but
 * built entirely from the real, already-implemented
 * `GET .../attendance-records` list endpoint, not an invented one.
 */
export function GatheringsListPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');

  // Declared before any conditional `return` below (Rules of Hooks),
  // matching every other reveal-panel milestone this session
  // (`PersonDetailPage.tsx`'s own lifecycle/assignment/grant state).
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState('');
  const [createGroupTarget, setCreateGroupTarget] = useState<RecordOption | null>(null);
  const [createStart, setCreateStart] = useState('');
  const [createEnd, setCreateEnd] = useState('');
  const [createVenue, setCreateVenue] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStatus, setEditStatus] = useState<GatheringStatusDto>('SCHEDULED');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  /** `[UX Design Implementation]` Final UX Design Specification §19 -
   * one shared "which row, in which mode" state covers both tables'
   * expandable row detail (Edit form or Attendance review), so the two
   * can never both be open on the same row at once, and opening one
   * closes whichever the other was showing anywhere else on the page. */
  const [expandedRow, setExpandedRow] = useState<{ id: string; mode: 'edit' | 'attendance' } | null>(null);

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultGatheringsQuery(state.actor);
  const query = typeFilter.trim() ? { ...baseQuery, type: typeFilter.trim() } : baseQuery;
  const gatheringsState = useGatheringsList(state.accessToken, query);
  const now = new Date();

  const openCreate = () => {
    setCreateType('');
    setCreateGroupTarget(null);
    setCreateStart('');
    setCreateEnd('');
    setCreateVenue('');
    setCreateError(undefined);
    setCreateOpen(true);
  };
  const cancelCreate = () => {
    setCreateOpen(false);
    setCreateError(undefined);
  };
  const submitCreate = async () => {
    if (!createType.trim() || !createStart) return;
    setCreateSubmitting(true);
    setCreateError(undefined);
    try {
      await createGathering(state.accessToken, {
        type: createType.trim(),
        ownerGroupId: createGroupTarget?.id,
        scheduledStart: fromDatetimeLocalValue(createStart),
        scheduledEnd: createEnd ? fromDatetimeLocalValue(createEnd) : undefined,
        venue: createVenue.trim().length > 0 ? createVenue.trim() : undefined,
      });
      gatheringsState.refetch();
      setCreateOpen(false);
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Something went wrong creating this Gathering.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEdit = (gathering: GatheringResponseDto) => {
    setEditStart(toDatetimeLocalValue(gathering.scheduledStart));
    setEditEnd(gathering.scheduledEnd ? toDatetimeLocalValue(gathering.scheduledEnd) : '');
    setEditVenue(gathering.venue ?? '');
    setEditStatus(gathering.status);
    setEditError(undefined);
    setExpandedRow({ id: gathering.id, mode: 'edit' });
  };
  const cancelEdit = () => {
    setExpandedRow(null);
    setEditError(undefined);
  };
  const submitEdit = async () => {
    if (!expandedRow || !editStart) return;
    setEditSubmitting(true);
    setEditError(undefined);
    try {
      await updateGathering(state.accessToken, expandedRow.id, {
        scheduledStart: fromDatetimeLocalValue(editStart),
        scheduledEnd: editEnd ? fromDatetimeLocalValue(editEnd) : null,
        venue: editVenue.trim().length > 0 ? editVenue.trim() : null,
        status: editStatus,
      });
      gatheringsState.refetch();
      setExpandedRow(null);
    } catch (error) {
      setEditError(extractErrorMessage(error, 'Something went wrong updating this Gathering.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const toggleAttendanceReview = (gatheringId: string) => {
    setExpandedRow((current) => (current?.id === gatheringId && current.mode === 'attendance' ? null : { id: gatheringId, mode: 'attendance' }));
  };

  /** `[Gathering Create/Update milestone]` "open it, edit it, save it" -
   * inline, not a separate detail/route, matching this page's own
   * established reveal-panel convention. Pre-filled from the real
   * `GatheringResponseDto` already in hand - no extra fetch needed.
   * Status options come from `nextGatheringStatusOptions` (the real,
   * forward-only domain state machine), so the picker can never offer a
   * transition the server would reject; a terminal Gathering's Status
   * field simply shows its own unchangeable value. Shared by both the
   * Upcoming and Historical tables below. */
  const renderEditForm = (gathering: GatheringResponseDto) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="gathering-edit-form">
      <Input label="Scheduled start" type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} />
      <Input label="Scheduled end (optional)" type="datetime-local" value={editEnd} onChange={(event) => setEditEnd(event.target.value)} />
      <Input label="Venue (optional)" value={editVenue} onChange={(event) => setEditVenue(event.target.value)} placeholder="e.g. Main Auditorium" />
      <Select
        label="Status"
        value={editStatus}
        onChange={(event) => setEditStatus(event.target.value as GatheringStatusDto)}
        options={[gathering.status, ...nextGatheringStatusOptions(gathering.status)].map((status) => ({ value: status, label: STATUS_LABEL[status] }))}
      />
      {editError && (
        <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
          {editError}
        </Text>
      )}
      <div style={{ display: 'flex', gap: theme.spacing[2] }}>
        <Button variant="primary" size="sm" disabled={!editStart} loading={editSubmitting} onClick={() => void submitEdit()}>
          Save
        </Button>
        <Button variant="secondary" size="sm" onClick={cancelEdit}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const groupCell = (gathering: GatheringResponseDto) =>
    gathering.ownerGroupId ? (
      <GroupNameText groupId={gathering.ownerGroupId} />
    ) : (
      <Text variant="bodySmall" color={theme.colors.text.secondary}>
        Branch-wide
      </Text>
    );

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 6 Gatherings workflow UI) - the phase brief's own priority
   * list for upcoming Gatherings: date/time, venue, owner group, status,
   * action. Type is kept too (omitting it would make a row
   * unidentifiable - "what even is this Gathering" - which the brief's
   * own umbrella goal, "make the important information immediately
   * scannable," rules out) but placed after the prioritized fields, not
   * before them. */
  const upcomingColumns: TableColumn<GatheringResponseDto>[] = [
    {
      key: 'dateTime',
      header: 'Date/Time',
      render: (gathering) => <Text variant="bodySmall">{formatDateTime(gathering.scheduledStart)}</Text>,
    },
    {
      key: 'venue',
      header: 'Venue',
      render: (gathering) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {gathering.venue ?? '—'}
        </Text>
      ),
    },
    {
      key: 'group',
      header: 'Owner Group',
      render: groupCell,
    },
    {
      key: 'type',
      header: 'Type',
      render: (gathering) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {gathering.type}
        </Text>
      ),
    },
    {
      key: 'preacher',
      header: 'Preacher',
      render: (gathering) =>
        gathering.preacherPersonId ? (
          <PersonNameText personId={gathering.preacherPersonId} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (gathering) => <Badge status={STATUS_BADGE_STATUS[gathering.status]}>{STATUS_LABEL[gathering.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (gathering) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={() => openEdit(gathering)} accessibilityLabel={`Edit Gathering: ${gathering.type}`}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  /** `[UX Design Implementation]` Final UX Design Specification §19
   * (Phase 6 Gatherings workflow UI) - the phase brief's own priority
   * list for historical Gatherings: date, type, group, attendance/
   * context, final status. `AttendanceCompletenessBadge` (unchanged,
   * reused) is the "attendance/context" column; the new "View
   * attendance" action expands the row into the real attendance list
   * (`AttendanceReviewPanel`). Edit stays available (this page never
   * removed that capability for a past Gathering before this change,
   * and the brief's own boundary rule is preserve-exactly, not
   * narrow) - just not the headline column it is for Upcoming. */
  const historicalColumns: TableColumn<GatheringResponseDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (gathering) => <Text variant="bodySmall">{formatDateOnly(gathering.scheduledStart)}</Text>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (gathering) => <Text variant="bodySmall">{gathering.type}</Text>,
    },
    {
      key: 'group',
      header: 'Group',
      render: groupCell,
    },
    {
      key: 'preacher',
      header: 'Preacher',
      render: (gathering) =>
        gathering.preacherPersonId ? (
          <PersonNameText personId={gathering.preacherPersonId} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (gathering) =>
        gathering.message ? (
          <div title={gathering.message} style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Text variant="bodySmall">{gathering.message}</Text>
          </div>
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            —
          </Text>
        ),
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (gathering) => <AttendanceCompletenessBadge gatheringId={gathering.id} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (gathering) => <Badge status={STATUS_BADGE_STATUS[gathering.status]}>{STATUS_LABEL[gathering.status]}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (gathering) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => toggleAttendanceReview(gathering.id)}
            accessibilityLabel={`${expandedRow?.id === gathering.id && expandedRow.mode === 'attendance' ? 'Hide' : 'View'} attendance for Gathering: ${gathering.type}`}
          >
            {expandedRow?.id === gathering.id && expandedRow.mode === 'attendance' ? 'Hide attendance' : 'View attendance'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openEdit(gathering)} accessibilityLabel={`Edit Gathering: ${gathering.type}`}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const upcoming = gatheringsState.status === 'success' ? gatheringsState.data.filter((gathering) => !isPast(gathering, now)) : [];
  const past = gatheringsState.status === 'success' ? gatheringsState.data.filter((gathering) => isPast(gathering, now)) : [];

  return (
    <PageContainer maxWidth={1120}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader
          title="Gatherings"
          action={
            !createOpen ? (
              <Button variant="secondary" size="sm" onClick={openCreate} accessibilityLabel="Create Gathering">
                + Create Gathering
              </Button>
            ) : undefined
          }
        />
        <Input label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} placeholder="e.g. SUNDAY_SERVICE" />

        {/* `[Gathering Create/Update milestone]` PRD §17.3's "Gathering:
            create/configure" row - always offered, no client-side role
            check. Traced against the real matrix, not assumed:
            `RESIDENT_PASTOR` holds only `gatherings.gathering.read` (no
            `.create` row at all), so this always 403s for that persona -
            the backend's real response is what they see, same as every
            other gated action in this app. `ownerGroupId` is optional (a
            Branch-wide Gathering) but only a BRANCH-scoped role (`ADMIN`)
            can actually create one that way - `ASSISTANT_PASTOR`/
            `BACENTA_LEADER`/`BASONTA_LEADER` need a real Group here to
            satisfy their own CLUSTER/OWN_GROUP scope. Neither constraint
            is enforced client-side. */}
        {createOpen && (
          <Card padding={6} testId="gathering-create-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Input label="Type" value={createType} onChange={(event) => setCreateType(event.target.value)} placeholder="e.g. SUNDAY_SERVICE" />
              <RecordPicker
                label="Owner Group (optional - leave blank for a Branch-wide Gathering)"
                placeholder="Search for a Bacenta or Basonta…"
                value={createGroupTarget}
                onChange={setCreateGroupTarget}
                onSearch={(query_) => searchGroupsForAssignment(state.accessToken, query_)}
              />
              <Input label="Scheduled start" type="datetime-local" value={createStart} onChange={(event) => setCreateStart(event.target.value)} />
              <Input label="Scheduled end (optional)" type="datetime-local" value={createEnd} onChange={(event) => setCreateEnd(event.target.value)} />
              <Input label="Venue (optional)" value={createVenue} onChange={(event) => setCreateVenue(event.target.value)} placeholder="e.g. Main Auditorium" />
              {createError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {createError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button variant="primary" size="sm" disabled={!createType.trim() || !createStart} loading={createSubmitting} onClick={() => void submitCreate()}>
                  Confirm create
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {gatheringsState.status === 'loading' && (
          <Card padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        )}

        {gatheringsState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Gatherings" onRetry={gatheringsState.refetch} />
          </Card>
        )}

        {gatheringsState.status === 'success' && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <SectionHeader title="Upcoming Gatherings" />
              <Card padding={6} testId="gatherings-list-card">
                <Table
                  testId="upcoming-gatherings-table"
                  columns={upcomingColumns}
                  data={upcoming}
                  getRowId={(gathering) => gathering.id}
                  isRowExpanded={(gathering) => expandedRow?.id === gathering.id && expandedRow.mode === 'edit'}
                  renderRowDetail={renderEditForm}
                  emptyIcon="calendar"
                  emptyTitle={typeFilter ? 'No matches' : 'No upcoming Gatherings'}
                  emptyDescription={
                    typeFilter ? `No upcoming Gatherings of type "${typeFilter}" in this scope.` : 'No upcoming Gatherings are visible in your current scope yet.'
                  }
                />
              </Card>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <SectionHeader title="Past Gatherings" />
              <Card padding={6} testId="past-gatherings-card">
                <Table
                  testId="past-gatherings-table"
                  columns={historicalColumns}
                  data={past}
                  getRowId={(gathering) => gathering.id}
                  isRowExpanded={(gathering) => expandedRow?.id === gathering.id}
                  renderRowDetail={(gathering) =>
                    expandedRow?.mode === 'attendance' ? <AttendanceReviewPanel gatheringId={gathering.id} /> : renderEditForm(gathering)
                  }
                  emptyIcon="calendar"
                  emptyTitle={typeFilter ? 'No matches' : 'No past Gatherings'}
                  emptyDescription={typeFilter ? `No past Gatherings of type "${typeFilter}" in this scope.` : 'No past Gatherings are visible in your current scope yet.'}
                />
              </Card>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
