import { Badge, Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { GatheringResponseDto, GatheringStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { useGatheringsList } from '../Gatherings/useGatheringsData';
import { StaffingTargetsPanel } from './StaffingTargetsPanel';
import { useOvercommitmentFlags, useRoster } from './useMinistryData';

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * PRD §16.3's "Basonta roster view" (FR-MIN-01) and its overcommitment
 * flag (FR-MIN-04), read together on one Card - `RosterService` already
 * computes both from the same active-membership set server-side, so there
 * is no reason to split them into two page sections. See
 * `MINISTRY_PAGE_DESIGN_NOTES.md` for why Staffing Target adequacy is not
 * shown here too.
 *
 * A pure presentational component (no router dependency) so
 * `MinistryPage` can render it directly for a Basonta Leader's own
 * `groupId` without a route round-trip, and `GroupDetailPage` can render
 * it for whichever `:groupId` the directory linked to (when that Group's
 * `type` resolves to `MINISTRY`) - same view-component/route-wrapper
 * split `PersonDetailPage`'s siblings use.
 *
 * `[Remaining Engineering Sprint, Milestone 11]` Now also renders
 * `StaffingTargetsPanel` below the roster - the exact gap this file's own
 * doc comment named above ("why Staffing Target adequacy is not shown
 * here too") is closed by this addition, not by a new page. `canEdit`
 * is `true` only for `BASONTA_LEADER` - the only role
 * `ministry.staffing_target.create` actually grants (Resident Pastor/Admin
 * reaching this same view via the directory only ever hold `.read`).
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 7
 * Ministry workflow UI) - a "Gatherings" section added between the roster
 * and Staffing Targets, reusing `useGatheringsList(ownerGroupId)` exactly
 * as `StaffingTargetsPanel` already does internally for its own Gathering
 * picker. Read-only, links out to the full Gatherings workflow rather
 * than recreating it here (task scope: "make the relationship clear...
 * do not recreate the Gatherings workflow").
 */
export function BasontaRosterView({ groupId }: { groupId: string }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const canEditStaffingTargets = state.status === 'authenticated' && state.actor?.role === 'BASONTA_LEADER';

  const rosterState = useRoster(accessToken, groupId);
  const overcommitmentState = useOvercommitmentFlags(accessToken, groupId);
  const gatheringsState = useGatheringsList(accessToken, { ownerGroupId: groupId });

  const overcommittedIds = new Set(
    overcommitmentState.status === 'success' ? overcommitmentState.data.map((flag) => flag.personId) : [],
  );

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 900 }}>
      <Heading level={1}>Basonta roster</Heading>

      {rosterState.status === 'loading' && (
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      )}

      {rosterState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load the roster" onRetry={rosterState.refetch} />
        </Card>
      )}

      {rosterState.status === 'success' && (
        <Card padding={6} testId="basonta-roster-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            {rosterState.data.length === 0 ? (
              <EmptyState title="No active workers yet" description="No one is currently rostered on this Basonta." />
            ) : (
              rosterState.data.map((member, index) => (
                <div key={member.personId}>
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
                      <PersonNameText personId={member.personId} />
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {`Serving since ${formatDate(member.startedAt)}`}
                      </Text>
                    </div>
                    {overcommittedIds.has(member.personId) && <Badge status="warning">Overcommitted</Badge>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      <Card padding={6} testId="basonta-gatherings-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
            <Heading level={3}>Gatherings</Heading>
            <Link to="/gatherings">
              <Text variant="bodySmall">View in Gatherings →</Text>
            </Link>
          </div>
          {gatheringsState.status === 'loading' && <Skeleton height={20} />}
          {gatheringsState.status === 'error' && <ErrorState title="Couldn't load Gatherings" onRetry={gatheringsState.refetch} />}
          {gatheringsState.status === 'success' && (
            <Table
              testId="basonta-gatherings-table"
              columns={gatheringColumns}
              data={gatheringsState.data}
              getRowId={(gathering) => gathering.id}
              emptyTitle="No Gatherings yet"
              emptyDescription="This Basonta doesn't own any Gatherings yet."
            />
          )}
        </div>
      </Card>

      <StaffingTargetsPanel groupId={groupId} canEdit={canEditStaffingTargets} />
    </div>
  );
}
