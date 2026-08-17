import { useMemo, useState, type ReactNode } from 'react';
import { Badge, Button, Card, EmptyState, ErrorState, Heading, Input, PageContainer, PageHeader, RecordPicker, SectionHeader, Select, Skeleton, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn } from '@ecclesia/ui-web';
import type { GatheringResponseDto, GatheringStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { searchGroupsForAssignment } from '../People/usePeopleData';
import { GroupNameText } from '../People/GroupNameText';
import { useBranchDashboardSummary } from '../DashboardPage/useBranchDashboardSummary';
import { useBacentaPulseScores } from '../Insights/useInsightsData';
import { AttendanceCompletenessBadge } from './AttendanceCompletenessBadge';
import { AttendanceReviewPanel } from './AttendanceReviewPanel';
import { createGathering, nextGatheringStatusOptions, resolveDefaultGatheringsQuery, updateGathering, useGatheringsList } from './useGatheringsData';

/** One real, honest summary figure - label above a large value, matching
 * the same "label above value" pattern this app's other summary surfaces
 * already use (e.g. Finance's "TOTAL GIVING THIS MONTH"). `value` is a
 * `ReactNode`, not a plain string, so a card can compose a resolved name
 * next to a number (`GroupNameText` + score) as naturally as a bare
 * number. */
function SummaryStatCard({ label, value, testId }: { label: string; value: ReactNode; testId?: string }) {
  const theme = useTheme();
  return (
    <Card padding={4} testId={testId}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Text variant="label" color={theme.colors.text.secondary}>
          {label.toUpperCase()}
        </Text>
        {value}
      </div>
    </Card>
  );
}

/** `[Branch Pastor portal, Gatherings redesign]` One leaderboard row - a
 * rank badge, the real Bacenta name, and its real Church Pulse score.
 * Only the #1 row gets a restrained brand-tinted badge; every other rank
 * is a plain outlined circle with its number - a real, understandable
 * ranking (per the approved brief: "visually emphasize 1st... without
 * becoming childish or overly gamified"), not a gold/silver/bronze medal
 * treatment. */
function LeaderboardRow({ rank, groupId, score }: { rank: number; groupId: string; score: number }) {
  const theme = useTheme();
  const isTop = rank === 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: theme.radius.full,
          backgroundColor: isTop ? theme.colors.brand.subtle : 'transparent',
          border: isTop ? 'none' : `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <Text variant="label" color={isTop ? theme.colors.brand.default : theme.colors.text.secondary}>
          {`#${rank}`}
        </Text>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text variant={isTop ? 'body' : 'bodySmall'}>
          <GroupNameText groupId={groupId} />
        </Text>
      </div>
      <Text variant="numericTabular" color={isTop ? theme.colors.brand.default : theme.colors.text.primary}>
        {score}
      </Text>
    </div>
  );
}

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

/** `[Branch Pastor portal, Gatherings sprint]` The real, observed window -
 * 8 weeks back (enough for a genuine "is this trending" read without
 * fetching a Branch's entire history) through 4 weeks ahead (near-term
 * planning visibility). Not a token, a `[Design decision]` local to this
 * one view - `GatheringService.list()`'s own default window (`now` to
 * `now + N days`) has no "look back" half at all, which is exactly the
 * gap this view exists to close. */
function useReportingWindow(): { from: string; to: string; label: string } {
  // `useMemo(..., [])` - computed once per mount, not once per render.
  // `useGatheringsList`'s dependency array includes `query.from`/`query.to`
  // verbatim; an unmemoized `new Date()` here would produce a new
  // millisecond-precision ISO string on every render, which
  // `useAsyncData` would read as a genuinely changed query and refetch
  // forever.
  return useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return { from: from.toISOString(), to: to.toISOString(), label: `${fmt(from)} – ${fmt(to)}` };
  }, []);
}

/**
 * `[Branch Pastor portal, Gatherings sprint]` Real, observed categories,
 * not an invented taxonomy - `Gathering.type` is a genuinely free-text
 * column (`db/schema.prisma`, confirmed - no enum exists anywhere in the
 * schema or `libs/contracts`). Live data in this deployment only ever
 * produces two values, `CELL_MEETING` and `SUNDAY_SERVICE` (confirmed
 * against both the seed data and the real running database) - "Other
 * Branch Services" is a real, honestly-empty bucket today, not a
 * fabricated one: any `type` value that isn't one of the two observed
 * ones lands there, so a future new type (a conference, a prayer
 * meeting) is correctly categorized the moment it's ever recorded,
 * without this view needing to know its name in advance.
 */
type GatheringCategory = 'bacenta-meeting' | 'sunday-service' | 'other';

function categorize(gathering: GatheringResponseDto): GatheringCategory {
  if (gathering.type === 'CELL_MEETING') return 'bacenta-meeting';
  if (gathering.type === 'SUNDAY_SERVICE') return 'sunday-service';
  return 'other';
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

interface SectionProps {
  id: string;
  title?: string;
  description?: string;
  gatherings: GatheringResponseDto[];
  emptyDescription: string;
  showGroupColumn: boolean;
  expandedId: string | null;
  onToggleAttendance: (id: string) => void;
  onEdit: (gathering: GatheringResponseDto) => void;
  editingId: string | null;
  renderEditForm: (gathering: GatheringResponseDto) => JSX.Element;
}

/** One reusable table shape for all three categories - date, (Bacenta,
 * where relevant), status, and an attendance action, sorted most-recent
 * first so the trend read ("is turnout holding up") doesn't require
 * scrolling to the bottom. */
function GatheringSection({
  id,
  title,
  description,
  gatherings,
  emptyDescription,
  showGroupColumn,
  expandedId,
  onToggleAttendance,
  onEdit,
  editingId,
  renderEditForm,
}: SectionProps) {
  const theme = useTheme();
  const now = new Date();
  const sorted = [...gatherings].sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime());

  const columns: TableColumn<GatheringResponseDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (gathering) => <Text variant="bodySmall">{formatDateTime(gathering.scheduledStart)}</Text>,
    },
    ...(showGroupColumn
      ? [
          {
            key: 'group',
            header: 'Bacenta',
            render: (gathering: GatheringResponseDto) =>
              gathering.ownerGroupId ? (
                <GroupNameText groupId={gathering.ownerGroupId} />
              ) : (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  —
                </Text>
              ),
          } satisfies TableColumn<GatheringResponseDto>,
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      render: (gathering) => <Badge status={STATUS_BADGE_STATUS[gathering.status]}>{STATUS_LABEL[gathering.status]}</Badge>,
    },
    {
      key: 'attendance',
      header: 'Attendance',
      render: (gathering) =>
        new Date(gathering.scheduledStart).getTime() < now.getTime() ? (
          <AttendanceCompletenessBadge gatheringId={gathering.id} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Upcoming
          </Text>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (gathering) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end' }}>
          {new Date(gathering.scheduledStart).getTime() < now.getTime() && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => onToggleAttendance(gathering.id)}
              accessibilityLabel={`${expandedId === gathering.id ? 'Hide' : 'View'} attendance for ${formatDateTime(gathering.scheduledStart)}`}
            >
              {expandedId === gathering.id ? 'Hide attendance' : 'View attendance'}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => onEdit(gathering)} accessibilityLabel={`Edit Gathering on ${formatDateTime(gathering.scheduledStart)}`}>
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {title && <SectionHeader title={title} description={description} />}
      <Card padding={6}>
        <Table
          testId={`gathering-section-${id}`}
          columns={columns}
          data={sorted}
          getRowId={(gathering) => gathering.id}
          isRowExpanded={(gathering) => gathering.id === expandedId || gathering.id === editingId}
          renderRowDetail={(gathering) => (gathering.id === editingId ? renderEditForm(gathering) : <AttendanceReviewPanel gatheringId={gathering.id} />)}
          emptyIcon="calendar"
          emptyTitle="None in this window"
          emptyDescription={emptyDescription}
        />
      </Card>
    </div>
  );
}

/**
 * `[Branch Pastor portal, Gatherings sprint]` The Branch Pastor's own
 * Gatherings presentation - Bacenta meetings / Sunday Services / other
 * Branch services, grouped so "how is attendance trending" is a scan, not
 * a filter-and-read exercise. Reads the exact same
 * `resolveDefaultGatheringsQuery`/`useGatheringsList`/`createGathering`/
 * `updateGathering` every other role's `GatheringsListPage` already uses -
 * no new endpoint, no widened RBAC, no client-side scope pre-emption.
 * `GatheringsListPage.tsx` itself is untouched; every other role keeps
 * that exact page, unaffected by this component's existence.
 */
export function BranchGatheringsView() {
  const theme = useTheme();
  const { state } = useAuth();
  const window_ = useReportingWindow();

  const [createOpen, setCreateOpen] = useState(false);
  const [createTypeChoice, setCreateTypeChoice] = useState<'CELL_MEETING' | 'SUNDAY_SERVICE' | 'OTHER'>('CELL_MEETING');
  const [createTypeOther, setCreateTypeOther] = useState('');
  const [createGroupTarget, setCreateGroupTarget] = useState<RecordOption | null>(null);
  const [createStart, setCreateStart] = useState('');
  const [createVenue, setCreateVenue] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [attendanceOpenId, setAttendanceOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editStatus, setEditStatus] = useState<GatheringStatusDto>('SCHEDULED');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultGatheringsQuery(state.actor);
  const gatheringsState = useGatheringsList(state.accessToken, { ...baseQuery, from: window_.from, to: window_.to });

  // `[Branch Pastor portal, Gatherings redesign]` The summary cards' two
  // real, cheap data sources - reused verbatim from the Dashboard/
  // Insights sprints, not new endpoints:
  // - `useBranchDashboardSummary` (`GET /insights/branch-dashboard-summary`,
  //   already reachable for `ASSISTANT_PASTOR` at BRANCH scope, already
  //   used by this role's own Insights/Finance pages) - its real
  //   `attendanceTotal` is the current calendar month's Branch-wide
  //   verified-attendance count. Deliberately labeled "this month,
  //   Branch-wide" below, not silently claimed to match this page's own
  //   8-week-back/4-week-ahead window - the two are real but different
  //   scopes, same "disclose the mismatch, don't imply false precision"
  //   precedent `BranchFinanceOverviewPage.tsx` already established for
  //   its own two differently-scoped giving figures. A true per-Gathering
  //   attendance total for this page's own window would need one
  //   attendance-record fetch per Gathering (dozens, across three
  //   categories and twelve weeks) - not fabricated, just not worth the
  //   real cost for a summary card when an honest, cheaper, real number
  //   is already one call away.
  // - `useBacentaPulseScores` (same cluster-scoped Church Pulse call
  //   `BranchInsightsView`'s own "Bacenta Health" ranking already uses,
  //   already sorted highest-first) - the one real, already-computed
  //   performance measure available for ranking Bacentas. No new scoring
  //   system invented.
  const summaryState = useBranchDashboardSummary(state.accessToken);
  const pulseState = useBacentaPulseScores(state.accessToken, state.actor.clusterBacentaIds ?? []);

  const toggleAttendance = (id: string) => {
    setEditingId(null);
    setAttendanceOpenId((current) => (current === id ? null : id));
  };
  const openEdit = (gathering: GatheringResponseDto) => {
    setAttendanceOpenId(null);
    setEditStart(gathering.scheduledStart.slice(0, 16));
    setEditVenue(gathering.venue ?? '');
    setEditStatus(gathering.status);
    setEditError(undefined);
    setEditingId(gathering.id);
  };
  const submitEdit = async (gatheringId: string) => {
    if (!editStart) return;
    setEditSubmitting(true);
    setEditError(undefined);
    try {
      await updateGathering(state.accessToken, gatheringId, {
        scheduledStart: new Date(editStart).toISOString(),
        venue: editVenue.trim().length > 0 ? editVenue.trim() : null,
        status: editStatus,
      });
      gatheringsState.refetch();
      setEditingId(null);
    } catch (error) {
      setEditError(extractErrorMessage(error, 'Something went wrong updating this Gathering.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const submitCreate = async () => {
    const type = createTypeChoice === 'OTHER' ? createTypeOther.trim() : createTypeChoice;
    if (!type || !createStart) return;
    setCreateSubmitting(true);
    setCreateError(undefined);
    try {
      await createGathering(state.accessToken, {
        type,
        ownerGroupId: createGroupTarget?.id,
        scheduledStart: new Date(createStart).toISOString(),
        venue: createVenue.trim().length > 0 ? createVenue.trim() : undefined,
      });
      gatheringsState.refetch();
      setCreateOpen(false);
      setCreateTypeChoice('CELL_MEETING');
      setCreateTypeOther('');
      setCreateGroupTarget(null);
      setCreateStart('');
      setCreateVenue('');
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Something went wrong creating this Gathering.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const renderEditForm = (gathering: GatheringResponseDto) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="branch-gathering-edit-form">
      <Input label="Scheduled start" type="datetime-local" value={editStart} onChange={(event) => setEditStart(event.target.value)} />
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
        <Button variant="primary" size="sm" disabled={!editStart} loading={editSubmitting} onClick={() => void submitEdit(gathering.id)}>
          Save
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const all = gatheringsState.status === 'success' ? gatheringsState.data : [];
  const bacentaMeetings = all.filter((g) => categorize(g) === 'bacenta-meeting');
  const sundayServices = all.filter((g) => categorize(g) === 'sunday-service');
  const other = all.filter((g) => categorize(g) === 'other');

  // Real, already-sorted-highest-first (`useBacentaPulseScores`'s own
  // contract) - `[0]` is genuinely the top Bacenta, not a re-sort here.
  const topBacenta = pulseState.status === 'success' && pulseState.data.length > 0 ? pulseState.data[0] : undefined;

  const summaryCardsBlock = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[4] }}>
      <SummaryStatCard label="Total Gatherings" value={<Heading level={2}>{String(all.length)}</Heading>} testId="gatherings-summary-total" />
      <SummaryStatCard label="Bacenta Meetings" value={<Heading level={2}>{String(bacentaMeetings.length)}</Heading>} testId="gatherings-summary-bacenta-meetings" />
      <SummaryStatCard
        label="Attendance This Month · Branch-wide"
        value={
          summaryState.status === 'loading' ? (
            <Skeleton height={28} width="60%" />
          ) : summaryState.status === 'error' ? (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Couldn't load
            </Text>
          ) : (
            <Heading level={2}>{String(summaryState.data.attendanceTotal)}</Heading>
          )
        }
        testId="gatherings-summary-attendance"
      />
      <SummaryStatCard
        label="Highest Performing Bacenta"
        value={
          pulseState.status === 'loading' ? (
            <Skeleton height={28} width="70%" />
          ) : pulseState.status === 'error' ? (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Couldn't load
            </Text>
          ) : !topBacenta ? (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Not yet available
            </Text>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: theme.spacing[2] }}>
              <Text variant="body">
                <GroupNameText groupId={topBacenta.groupId} />
              </Text>
              <Text variant="numericTabular" color={theme.colors.brand.default}>
                {Math.round(topBacenta.score)}
              </Text>
            </div>
          )
        }
        testId="gatherings-summary-top-bacenta"
      />
    </div>
  );

  const leaderboardBlock = (
    <Card padding={6} testId="bacenta-leaderboard-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <SectionHeader title="Bacenta Leaderboard" description="Church Pulse score, strongest first" />
        {pulseState.status === 'loading' && <Skeleton height={140} />}
        {pulseState.status === 'error' && <ErrorState title="Couldn't load the leaderboard" onRetry={pulseState.refetch} />}
        {pulseState.status === 'success' && pulseState.data.length === 0 && (
          <EmptyState icon="checkCircle" title="No scores yet" description="Church Pulse hasn't computed a score for any Bacenta in your cluster yet." />
        )}
        {pulseState.status === 'success' && pulseState.data.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {pulseState.data.map((row, index) => (
              <LeaderboardRow key={row.groupId} rank={index + 1} groupId={row.groupId} score={Math.round(row.score)} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <PageContainer maxWidth={1120}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
      <PageHeader
        title="Gatherings"
        context={`${state.actor.branchName} · ${window_.label}`}
        action={
          !createOpen ? (
            <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)} accessibilityLabel="Create Gathering">
              + Create Gathering
            </Button>
          ) : undefined
        }
      />

      {summaryCardsBlock}

      {leaderboardBlock}

      {createOpen && (
        <Card padding={6} testId="branch-gathering-create-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Select
              label="Type"
              value={createTypeChoice}
              onChange={(event) => setCreateTypeChoice(event.target.value as typeof createTypeChoice)}
              options={[
                { value: 'CELL_MEETING', label: 'Bacenta Meeting' },
                { value: 'SUNDAY_SERVICE', label: 'Sunday Service' },
                { value: 'OTHER', label: 'Other Branch Service…' },
              ]}
            />
            {createTypeChoice === 'OTHER' && (
              <Input label="Service name" value={createTypeOther} onChange={(event) => setCreateTypeOther(event.target.value)} placeholder="e.g. PRAYER_MEETING" />
            )}
            <RecordPicker
              label="Bacenta (optional — leave blank for a Branch-wide service)"
              placeholder="Search for a Bacenta…"
              value={createGroupTarget}
              onChange={setCreateGroupTarget}
              onSearch={(query) => searchGroupsForAssignment(state.accessToken, query)}
            />
            <Input label="Scheduled start" type="datetime-local" value={createStart} onChange={(event) => setCreateStart(event.target.value)} />
            <Input label="Venue (optional)" value={createVenue} onChange={(event) => setCreateVenue(event.target.value)} placeholder="e.g. Main Auditorium" />
            {createError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {createError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button
                variant="primary"
                size="sm"
                disabled={!createStart || (createTypeChoice === 'OTHER' && !createTypeOther.trim())}
                loading={createSubmitting}
                onClick={() => void submitCreate()}
              >
                Confirm create
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
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
          </div>
        </Card>
      )}

      {gatheringsState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load Gatherings" onRetry={gatheringsState.refetch} />
        </Card>
      )}

      {gatheringsState.status === 'success' && all.length === 0 && (
        <EmptyState icon="calendar" title="No Gatherings in this window" description="No Bacenta meetings, Sunday Services, or other Branch services are recorded in this window yet." />
      )}

      {gatheringsState.status === 'success' && all.length > 0 && (
        <>
          <GatheringSection
            id="bacenta-meetings"
            title="Bacenta Meetings"
            description={`${bacentaMeetings.length} in this window, most recent first`}
            gatherings={bacentaMeetings}
            emptyDescription="No Bacenta meetings recorded in this window."
            showGroupColumn
            expandedId={attendanceOpenId}
            onToggleAttendance={toggleAttendance}
            onEdit={openEdit}
            editingId={editingId}
            renderEditForm={renderEditForm}
          />
          <GatheringSection
            id="sunday-services"
            title="Sunday Services"
            description={`${sundayServices.length} in this window, most recent first`}
            gatherings={sundayServices}
            emptyDescription="No Sunday Services recorded in this window."
            showGroupColumn={false}
            expandedId={attendanceOpenId}
            onToggleAttendance={toggleAttendance}
            onEdit={openEdit}
            editingId={editingId}
            renderEditForm={renderEditForm}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <SectionHeader
              title="Other Branch Services"
              description="Any Branch service that isn't a Bacenta meeting or Sunday Service — prayer meetings, conferences, and similar"
            />
            {other.length === 0 ? (
              <Card padding={6}>
                <EmptyState icon="calendar" title="None recorded yet" description="No other Branch services have been recorded in this window." />
              </Card>
            ) : (
              <GatheringSection
                id="other-services"
                gatherings={other}
                emptyDescription="No other Branch services recorded in this window."
                showGroupColumn
                expandedId={attendanceOpenId}
                onToggleAttendance={toggleAttendance}
                onEdit={openEdit}
                editingId={editingId}
                renderEditForm={renderEditForm}
              />
            )}
          </div>
        </>
      )}
    </div>
    </PageContainer>
  );
}
