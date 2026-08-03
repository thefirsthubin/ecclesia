import { useState } from 'react';
import { Badge, Card, Divider, EmptyState, ErrorState, Heading, Input, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { GatheringResponseDto, GatheringStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { GroupNameText } from '../People/GroupNameText';
import { AttendanceCompletenessBadge } from './AttendanceCompletenessBadge';
import { resolveDefaultGatheringsQuery, useGatheringsList } from './useGatheringsData';

const STATUS_BADGE_STATUS: Record<GatheringStatusDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  SCHEDULED: 'info',
  CANCELLED: 'danger',
  COMPLETED: 'success',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/** A Gathering is "past" once its window for recording attendance has
 * closed - `scheduledEnd` when set, otherwise `scheduledStart` as the
 * closest available proxy (same fallback `libs/domain/gatherings`'s own
 * `evaluateAttendanceCompleteness` effectively applies by only measuring
 * a window when `scheduledEnd` exists at all). Only past Gatherings get
 * an attendance-completeness badge - there's nothing to flag on one that
 * hasn't happened yet. */
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
 */
export function GatheringsListPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const [typeFilter, setTypeFilter] = useState('');

  if (state.status !== 'authenticated') return null;

  const baseQuery = resolveDefaultGatheringsQuery(state.actor);
  const query = typeFilter.trim() ? { ...baseQuery, type: typeFilter.trim() } : baseQuery;
  const gatheringsState = useGatheringsList(state.accessToken, query);
  const now = new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 720 }}>
      <Heading level={1}>Gatherings</Heading>
      <Input label="Filter by type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} placeholder="e.g. SUNDAY_SERVICE" />

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
        <Card padding={6} testId="gatherings-list-card">
          {gatheringsState.data.length === 0 ? (
            <EmptyState
              icon="calendar"
              title={typeFilter ? 'No matches' : 'No Gatherings found'}
              description={typeFilter ? `No Gatherings of type "${typeFilter}" in this scope.` : 'No Gatherings are visible in your current scope yet.'}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {gatheringsState.data.map((gathering, index) => (
                <div key={gathering.id}>
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
                        <Text variant="bodySmall">{gathering.type}</Text>
                        <Badge status={STATUS_BADGE_STATUS[gathering.status]}>{gathering.status}</Badge>
                      </div>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {formatDateTime(gathering.scheduledStart)}
                        {gathering.venue ? ` · ${gathering.venue}` : ''}
                        {gathering.ownerGroupId ? (
                          <>
                            {' · '}
                            <GroupNameText groupId={gathering.ownerGroupId} />
                          </>
                        ) : (
                          ' · Branch-wide'
                        )}
                      </Text>
                    </div>
                    {isPast(gathering, now) && <AttendanceCompletenessBadge gatheringId={gathering.id} />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
