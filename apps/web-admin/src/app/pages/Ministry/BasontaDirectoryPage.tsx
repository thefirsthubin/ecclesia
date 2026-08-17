import { useState } from 'react';
import { Badge, Button, Card, ErrorState, Heading, Input, PageContainer, Select, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import { GROUP_LIFECYCLE_STATUS_VALUES } from '@ecclesia/contracts';
import type { GroupLifecycleStatusDto, GroupResponseDto, GroupTypeDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { Link } from '../../router/router';
import { createGroup, updateGroup, useGroupDirectory } from './useMinistryData';

const GROUP_TYPE_LABEL: Record<GroupTypeDto, string> = {
  PASTORAL_CARE: 'Bacenta',
  MINISTRY: 'Basonta',
};

const LIFECYCLE_STATUS_LABEL: Record<GroupLifecycleStatusDto, string> = {
  ACTIVE: 'Active',
  SPLITTING: 'Splitting',
  MERGING: 'Merging',
  ARCHIVED: 'Archived',
};

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
 * `[Group CRUD milestone]` PRD §16.3's Ministry surface, broadened from
 * this sprint's original Basonta-only directory now that Create/Update
 * exist for the full `people.group.*` surface (Bacentas and Basontas
 * alike - both live in the same `people.groups` table and the same
 * `GET/POST/PATCH /groups` routes, see `useMinistryData.ts`'s own doc
 * comments). For the BRANCH-scoped roles (`RESIDENT_PASTOR`/`ADMIN`) who
 * are this directory's only real audience (`GroupListResourceContextGuard`
 * always resolves BRANCH - see `MINISTRY_PAGE_DESIGN_NOTES.md` §3).
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI):
 * - Hand-rolled Card+Divider list replaced with the shared `Table`
 *   (§9 adoption, same as every other domain this phase), explicit
 *   columns instead of one run-together row of Badges.
 * - **Both Group types now link to `/ministry/:id`.** The prior "the
 *   roster Link stays Basonta-only" note no longer holds: `GroupDetailPage`
 *   (replacing the old `BasontaRosterPage` route wrapper) now branches on
 *   `group.type` and renders a real `BacentaDetailView` for
 *   `PASTORAL_CARE` groups (Members/Gatherings/Follow-up, all backed by
 *   existing endpoints - see that file's own doc comment). A Bacenta row
 *   is no longer "nothing to link to."
 * - **No "Leader" column.** Task scope explicitly asks the directory to
 *   surface who leads each Group, but there is no group-scoped Role
 *   Assignment endpoint anywhere in this codebase (only
 *   `GET /people/:personId/role-assignments`, per-person) and
 *   `RosterMemberResponseDto` carries no role/leader field either.
 *   Fetching every row's leader would mean one Role Assignment call per
 *   Person on every Group in the Branch just to decorate a list column -
 *   exactly the "additional API calls merely to produce decorative
 *   summaries" this phase's brief forbids. Left out here, per that same
 *   brief's own instruction to document rather than fake or N+1 around a
 *   missing relationship; a Group's real leadership is visible today via
 *   its leader's own Profile -> Role history tab (`PersonDetailPage.tsx`).
 */
export function BasontaDirectoryPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const directoryState = useGroupDirectory(accessToken);

  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<GroupTypeDto>('PASTORAL_CARE');
  const [createName, setCreateName] = useState('');
  const [createMeetingSchedule, setCreateMeetingSchedule] = useState('');
  const [createMeetingLocation, setCreateMeetingLocation] = useState('');
  const [createCategory, setCreateCategory] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMeetingSchedule, setEditMeetingSchedule] = useState('');
  const [editMeetingLocation, setEditMeetingLocation] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editLifecycleStatus, setEditLifecycleStatus] = useState<GroupLifecycleStatusDto>('ACTIVE');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  const openCreate = () => {
    setCreateType('PASTORAL_CARE');
    setCreateName('');
    setCreateMeetingSchedule('');
    setCreateMeetingLocation('');
    setCreateCategory('');
    setCreateError(undefined);
    setCreateOpen(true);
  };
  const cancelCreate = () => {
    setCreateOpen(false);
    setCreateError(undefined);
  };
  const submitCreate = async () => {
    if (!createName.trim()) return;
    setCreateSubmitting(true);
    setCreateError(undefined);
    try {
      await createGroup(state.accessToken, {
        type: createType,
        name: createName.trim(),
        meetingSchedule: createMeetingSchedule.trim().length > 0 ? createMeetingSchedule.trim() : undefined,
        meetingLocation: createMeetingLocation.trim().length > 0 ? createMeetingLocation.trim() : undefined,
        category: createCategory.trim().length > 0 ? createCategory.trim() : undefined,
      });
      directoryState.refetch();
      setCreateOpen(false);
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Something went wrong creating this Group.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const openEdit = (group: GroupResponseDto) => {
    setEditingId(group.id);
    setEditName(group.name);
    setEditMeetingSchedule(group.meetingSchedule ?? '');
    setEditMeetingLocation(group.meetingLocation ?? '');
    setEditCategory(group.category ?? '');
    setEditLifecycleStatus(group.lifecycleStatus);
    setEditError(undefined);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditError(undefined);
  };
  const submitEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setEditSubmitting(true);
    setEditError(undefined);
    try {
      await updateGroup(state.accessToken, editingId, {
        name: editName.trim(),
        meetingSchedule: editMeetingSchedule.trim().length > 0 ? editMeetingSchedule.trim() : null,
        meetingLocation: editMeetingLocation.trim().length > 0 ? editMeetingLocation.trim() : null,
        category: editCategory.trim().length > 0 ? editCategory.trim() : null,
        lifecycleStatus: editLifecycleStatus,
      });
      directoryState.refetch();
      setEditingId(null);
    } catch (error) {
      setEditError(extractErrorMessage(error, 'Something went wrong updating this Group.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const columns: TableColumn<GroupResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (group) => (
        <Link to={`/ministry/${group.id}`}>
          <Text variant="bodySmall">{group.name}</Text>
        </Link>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (group) => <Badge status="neutral">{GROUP_TYPE_LABEL[group.type]}</Badge>,
    },
    {
      key: 'meetingLocation',
      header: 'Meets at',
      render: (group) => (
        <Text variant="bodySmall" color={group.meetingLocation ? undefined : theme.colors.text.secondary}>
          {group.meetingLocation ?? 'Not set'}
        </Text>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (group) => (
        <Text variant="bodySmall" color={group.category ? undefined : theme.colors.text.secondary}>
          {group.category ?? '—'}
        </Text>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (group) => (
        <Badge status={group.lifecycleStatus === 'ACTIVE' ? 'success' : group.lifecycleStatus === 'ARCHIVED' ? 'neutral' : 'warning'}>
          {LIFECYCLE_STATUS_LABEL[group.lifecycleStatus]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (group) =>
        editingId === group.id ? null : (
          <Button variant="secondary" size="sm" onClick={() => openEdit(group)} accessibilityLabel={`Edit Group: ${group.name}`}>
            Edit
          </Button>
        ),
    },
  ];

  return (
    <PageContainer maxWidth={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Heading level={1}>Ministry</Heading>
          {/* `[Bug fix]` Same "+ Create X" trigger convention every other
              domain this phase already follows (Pastoral Care/Gatherings) -
              `secondary`, not `primary`, so it never competes with a form's
              own primary "Confirm create" action once opened. */}
          {!createOpen && (
            <Button variant="secondary" size="sm" onClick={openCreate} accessibilityLabel="Create Group">
              + Create Group
            </Button>
          )}
        </div>

        {/* `[Group CRUD milestone]` Always offered, no client-side role
            check - traced against the real matrix, not assumed: only
            `RESIDENT_PASTOR`/`ADMIN` hold `people.group.create` at all
            (BRANCH scope, no CLUSTER/OWN_GROUP create grant exists), so
            every other role that could even reach this page (none do - see
            this file's own doc comment) would 403 anyway. The backend's
            real response is what the caller sees. */}
        {createOpen && (
          <Card padding={6} testId="group-create-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Select
                label="Type"
                value={createType}
                onChange={(event) => setCreateType(event.target.value as GroupTypeDto)}
                options={[
                  { value: 'PASTORAL_CARE', label: 'Bacenta' },
                  { value: 'MINISTRY', label: 'Basonta' },
                ]}
              />
              <Input label="Name" value={createName} onChange={(event) => setCreateName(event.target.value)} placeholder="e.g. Grace Bacenta" />
              <Input
                label="Meeting schedule (optional)"
                value={createMeetingSchedule}
                onChange={(event) => setCreateMeetingSchedule(event.target.value)}
                placeholder="e.g. Sundays 9am"
              />
              <Input
                label="Meeting location (optional)"
                value={createMeetingLocation}
                onChange={(event) => setCreateMeetingLocation(event.target.value)}
                placeholder="e.g. Main Auditorium"
              />
              <Input label="Category (optional)" value={createCategory} onChange={(event) => setCreateCategory(event.target.value)} placeholder="e.g. Technical" />
              {createError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {createError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button variant="primary" size="sm" disabled={!createName.trim()} loading={createSubmitting} onClick={() => void submitCreate()}>
                  Confirm create
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {directoryState.status === 'loading' && (
          <Card padding={6}>
            <Table testId="basonta-directory-table" columns={columns} data={[]} getRowId={(group) => group.id} loading />
          </Card>
        )}

        {directoryState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load the Group directory" onRetry={directoryState.refetch} />
          </Card>
        )}

        {directoryState.status === 'success' && (
          <Card padding={6} testId="basonta-directory-card">
            <Table
              testId="basonta-directory-table"
              columns={columns}
              data={directoryState.data}
              getRowId={(group) => group.id}
              isRowExpanded={(group) => editingId === group.id}
              renderRowDetail={() => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="group-edit-form">
                  <Input label="Name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                  <Input label="Meeting schedule (optional)" value={editMeetingSchedule} onChange={(event) => setEditMeetingSchedule(event.target.value)} />
                  <Input label="Meeting location (optional)" value={editMeetingLocation} onChange={(event) => setEditMeetingLocation(event.target.value)} />
                  <Input label="Category (optional)" value={editCategory} onChange={(event) => setEditCategory(event.target.value)} />
                  <Select
                    label="Status"
                    value={editLifecycleStatus}
                    onChange={(event) => setEditLifecycleStatus(event.target.value as GroupLifecycleStatusDto)}
                    options={GROUP_LIFECYCLE_STATUS_VALUES.map((status) => ({ value: status, label: LIFECYCLE_STATUS_LABEL[status] }))}
                  />
                  {editError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {editError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button variant="primary" size="sm" disabled={!editName.trim()} loading={editSubmitting} onClick={() => void submitEdit()}>
                      Save
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              emptyIcon="church"
              emptyTitle="No Groups yet"
              emptyDescription="No Bacentas or Basontas have been created in your Branch."
            />
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
