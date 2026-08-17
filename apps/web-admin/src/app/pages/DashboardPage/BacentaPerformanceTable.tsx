import { useMemo, useState } from 'react';
import { Badge, Card, ErrorState, Heading, Table, Text, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';

import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import type { BacentaPerformanceRow } from './useBranchPastorDashboardData';

export interface BacentaPerformanceTableProps {
  status: 'loading' | 'error' | 'success';
  rows: BacentaPerformanceRow[];
  weekStartDateOnly: string;
  onRetry: () => void;
  onRowClick?: (row: BacentaPerformanceRow) => void;
}

type SortKey =
  | 'name'
  | 'memberCount'
  | 'sundayAttendance'
  | 'sundayAttendancePercent'
  | 'meetingAttendance'
  | 'meetingAttendancePercent'
  | 'meetingOfferingMinor';

/**
 * Null placement (a missing record) is resolved *before* the
 * ascending/descending flip below, not as part of the flippable
 * comparison itself - a null always sorts last "regardless of
 * direction" (this component's own doc comment) means exactly that: if
 * null-vs-real were folded into the same signed number the direction
 * flip negates, reversing the sort direction would also flip nulls to
 * the front, which is the opposite of the intended, direction-
 * independent behavior.
 */
function compareWithNullsLast<T>(a: T | null, b: T | null, compareReal: (a: T, b: T) => number): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return compareReal(a, b);
}

function compareAmountMinor(a: string, b: string): number {
  const diff = BigInt(a) - BigInt(b);
  return diff > 0n ? 1 : diff < 0n ? -1 : 0;
}

/** `weekStartDateOnly` is the Monday `getCurrentWeekBounds` computes the
 * week from - this Bacenta Pastor question is about Sunday, the day 6
 * later in that same Monday-start week. Pure date math on a real,
 * already-fetched value - not a second date fabricated independently of
 * the data the table actually reflects. */
function formatSundayLabel(weekStartDateOnly: string): string {
  const [year, month, day] = weekStartDateOnly.split('-').map(Number);
  const sunday = new Date(year, month - 1, day + 6);
  return sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** A present-count cell for Sunday/Meeting attendance - "22 / 24" against
 * this Bacenta's own `memberCount` so the number is never read without
 * its denominator. `null` (no Gathering recorded at all this week - a
 * real, distinct fact from "recorded, zero present") renders as a plain
 * muted em dash, never a fabricated "0 / 24". */
function AttendanceCountCell({ count, memberCount }: { count: number | null; memberCount: number }) {
  const theme = useTheme();
  if (count === null) {
    return (
      <Text as="span" variant="numericTabular" color={theme.colors.text.disabled}>
        {'—'}
      </Text>
    );
  }
  return (
    <Text as="span" variant="numericTabular">
      {`${count} / ${memberCount}`}
    </Text>
  );
}

/** The adjacent percent cell - a real objective-data-state indicator
 * (`Badge status="neutral"`, never a fabricated health-threshold color)
 * when the underlying Gathering was never recorded, so a genuinely
 * missing record is never confused with a recorded-but-empty one. */
function AttendancePercentCell({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <Badge status="neutral">Not recorded</Badge>;
  }
  return (
    <Text as="span" variant="numericTabular">
      {`${percent}%`}
    </Text>
  );
}

/**
 * `[Branch Pastor Dashboard sprint]` The hero module - the Branch
 * Pastor's operational command surface, not a generic admin table.
 * Reuses `Table` (`ui-web`) as-is - a real `<table>`, sortable
 * `aria-sort` headers (now keyboard-activatable rows too, a `Table`
 * primitive fix made alongside this change), its own horizontal-scroll
 * wrapper - no new table primitive.
 *
 * Seven sortable columns (Bacenta, Members, Sunday Attendance, Sunday
 * Attendance %, Bacenta Meeting Attendance, Bacenta Meeting Attendance %,
 * Bacenta Meeting Offering) - count and percent are visually paired as
 * adjacent columns rather than merged into one un-sortable cell, so both
 * "who had the most people" and "who had the best turnout rate" are each
 * independently sortable, per the approved spec's explicit column list.
 *
 * Sorting is local/client-side (this dataset is one Branch's current-week
 * Bacenta list, never paginated) - nulls (a missing record) always sort
 * last regardless of direction, so "who's missing a record" is never
 * buried by a numeric sort the way a fabricated `0` would be. Default
 * sort is Sunday Attendance, descending (approved spec) - the strongest
 * and weakest Bacentas are both visible without scrolling or re-sorting.
 *
 * Deliberately does **not** color-code attendance by a "healthy/low/
 * declining" threshold - no such threshold exists anywhere in
 * `libs/domain` today, and the approved spec is explicit not to invent
 * one. The real count/percent is shown as plain text; only the
 * objectively-true "missing record" state gets a status treatment.
 */
export function BacentaPerformanceTable({ status, rows, weekStartDateOnly, onRetry, onRowClick }: BacentaPerformanceTableProps) {
  const theme = useTheme();
  const [sortKey, setSortKey] = useState<SortKey>('sundayAttendance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let result: number;
      switch (sortKey) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'memberCount':
          result = a.memberCount - b.memberCount;
          break;
        case 'sundayAttendance':
          if (a.sundayAttendance === null || b.sundayAttendance === null) {
            return compareWithNullsLast(a.sundayAttendance, b.sundayAttendance, () => 0);
          }
          result = a.sundayAttendance - b.sundayAttendance;
          break;
        case 'sundayAttendancePercent':
          if (a.sundayAttendancePercent === null || b.sundayAttendancePercent === null) {
            return compareWithNullsLast(a.sundayAttendancePercent, b.sundayAttendancePercent, () => 0);
          }
          result = a.sundayAttendancePercent - b.sundayAttendancePercent;
          break;
        case 'meetingAttendance':
          if (a.meetingAttendance === null || b.meetingAttendance === null) {
            return compareWithNullsLast(a.meetingAttendance, b.meetingAttendance, () => 0);
          }
          result = a.meetingAttendance - b.meetingAttendance;
          break;
        case 'meetingAttendancePercent':
          if (a.meetingAttendancePercent === null || b.meetingAttendancePercent === null) {
            return compareWithNullsLast(a.meetingAttendancePercent, b.meetingAttendancePercent, () => 0);
          }
          result = a.meetingAttendancePercent - b.meetingAttendancePercent;
          break;
        case 'meetingOfferingMinor':
          if (a.meetingOfferingMinor === null || b.meetingOfferingMinor === null) {
            return compareWithNullsLast(a.meetingOfferingMinor, b.meetingOfferingMinor, () => 0);
          }
          result = compareAmountMinor(a.meetingOfferingMinor, b.meetingOfferingMinor);
          break;
      }
      return sortDirection === 'asc' ? result : -result;
    });
    return copy;
  }, [rows, sortKey, sortDirection]);

  const handleSortChange = (key: string) => {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key as SortKey);
      setSortDirection(key === 'name' ? 'asc' : 'desc');
    }
  };

  const columns: TableColumn<BacentaPerformanceRow>[] = [
    { key: 'name', header: 'Bacenta', sortable: true, render: (row) => <Text as="span">{row.name}</Text> },
    { key: 'memberCount', header: 'Members', sortable: true, align: 'right', width: 80, render: (row) => <Text as="span" variant="numericTabular">{row.memberCount}</Text> },
    {
      // Header shortened from the spec's full "Sunday Attendance" label -
      // the `<th>` never wraps (`Table`'s own `thStyle`), so a long label
      // imposes a hard minimum column width; "Sunday" plus the card's own
      // "Bacenta Performance" title and the adjacent "Sunday %" column
      // already disambiguate it without that cost. The underlying column
      // (`sundayAttendance`, present/total data) is unchanged.
      key: 'sundayAttendance',
      header: 'Sunday',
      sortable: true,
      align: 'right',
      width: 90,
      render: (row) => <AttendanceCountCell count={row.sundayAttendance} memberCount={row.memberCount} />,
    },
    {
      key: 'sundayAttendancePercent',
      header: 'Sunday %',
      sortable: true,
      align: 'right',
      width: 80,
      render: (row) => <AttendancePercentCell percent={row.sundayAttendancePercent} />,
    },
    {
      key: 'meetingAttendance',
      header: 'Meeting',
      sortable: true,
      align: 'right',
      width: 90,
      render: (row) => <AttendanceCountCell count={row.meetingAttendance} memberCount={row.memberCount} />,
    },
    {
      key: 'meetingAttendancePercent',
      header: 'Meeting %',
      sortable: true,
      align: 'right',
      width: 80,
      render: (row) => <AttendancePercentCell percent={row.meetingAttendancePercent} />,
    },
    {
      key: 'meetingOfferingMinor',
      header: 'Offering',
      sortable: true,
      align: 'right',
      width: 120,
      render: (row) =>
        row.meetingOfferingMinor === null ? (
          <Badge status="neutral">Not recorded</Badge>
        ) : (
          <Text as="span" variant="numericTabular">
            {formatAmountMinor(row.meetingOfferingMinor, 'GHS')}
          </Text>
        ),
    },
  ];

  if (status === 'error') {
    return (
      <Card padding={6} elevation={1}>
        <ErrorState title="Couldn't load Bacenta performance" onRetry={onRetry} />
      </Card>
    );
  }

  return (
    <Card padding={6} elevation={1} testId="bacenta-performance-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: theme.spacing[2] }}>
          <Heading level={3}>Bacenta Performance</Heading>
          {weekStartDateOnly && (
            <Text variant="caption" color={theme.colors.text.secondary}>
              {`This Sunday · ${formatSundayLabel(weekStartDateOnly)}`}
            </Text>
          )}
        </div>
        <Table
          columns={columns}
          data={sortedRows}
          getRowId={(row) => row.groupId}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRowClick={onRowClick}
          loading={status === 'loading'}
          emptyTitle="No Bacentas in your cluster yet"
          testId="bacenta-performance-table"
        />
      </div>
    </Card>
  );
}
