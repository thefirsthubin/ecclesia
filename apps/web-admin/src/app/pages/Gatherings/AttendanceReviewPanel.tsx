import { Badge, ErrorState, Skeleton, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { AttendanceRecordResponseDto, AttendanceStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { useAttendanceRecords } from './useGatheringsData';

const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatusDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  PRESENT: 'success',
  ABSENT: 'danger',
  EXCUSED: 'warning',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 6
 * Gatherings workflow UI) - "Attendance review": the real, per-Gathering
 * `GET .../attendance-records` list (`useAttendanceRecords`), not the
 * binary completeness check `AttendanceCompletenessBadge` already shows.
 * Read-only, no create/edit affordance - see `useAttendanceRecords`'s own
 * doc comment for why a recording UI does not belong on this page.
 * Rendered as a `GatheringsListPage` row's expandable detail, so which
 * Gathering this attendance belongs to is never ambiguous - it's the row
 * the user just expanded.
 */
export function AttendanceReviewPanel({ gatheringId }: { gatheringId: string }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const recordsState = useAttendanceRecords(accessToken, gatheringId);

  const columns: TableColumn<AttendanceRecordResponseDto>[] = [
    {
      key: 'person',
      header: 'Person',
      render: (record) => <PersonNameText personId={record.personId} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => <Badge status={ATTENDANCE_STATUS_BADGE[record.status]}>{record.status}</Badge>,
    },
    {
      key: 'recordedBy',
      header: 'Recorded by',
      render: (record) => <PersonNameText personId={record.recordedByPersonId} />,
    },
    {
      key: 'recordedAt',
      header: 'Recorded',
      render: (record) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {formatDateTime(record.recordedAt)}
        </Text>
      ),
    },
  ];

  if (recordsState.status === 'loading') {
    return <Skeleton height={20} />;
  }

  if (recordsState.status === 'error') {
    return <ErrorState title="Couldn't load attendance" onRetry={recordsState.refetch} />;
  }

  return (
    <Table
      testId={`attendance-review-table-${gatheringId}`}
      columns={columns}
      data={recordsState.data}
      getRowId={(record) => record.id}
      emptyIcon="checkCircle"
      emptyTitle="No attendance recorded yet"
      emptyDescription="No one has recorded attendance for this Gathering yet."
    />
  );
}
