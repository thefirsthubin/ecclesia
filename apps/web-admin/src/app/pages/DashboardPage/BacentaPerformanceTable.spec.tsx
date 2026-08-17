import { fireEvent, render, screen, within } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { BacentaPerformanceTable } from './BacentaPerformanceTable';
import type { BacentaPerformanceRow } from './useBranchPastorDashboardData';

const ROWS: BacentaPerformanceRow[] = [
  {
    groupId: 'bacenta-1',
    name: 'Grace Bacenta',
    memberCount: 42,
    sundayAttendance: 31,
    sundayAttendancePercent: 74,
    meetingAttendance: 28,
    meetingAttendancePercent: 67,
    meetingOfferingMinor: '25000',
  },
  {
    groupId: 'bacenta-2',
    name: 'Faith Bacenta',
    memberCount: 20,
    sundayAttendance: null,
    sundayAttendancePercent: null,
    meetingAttendance: null,
    meetingAttendancePercent: null,
    meetingOfferingMinor: null,
  },
];

function renderTable(overrides: Partial<Parameters<typeof BacentaPerformanceTable>[0]> = {}) {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <BacentaPerformanceTable status="success" rows={ROWS} weekStartDateOnly="2026-01-05" onRetry={jest.fn()} {...overrides} />
      </RouterProvider>
    </ThemeProvider>,
  );
}

describe('BacentaPerformanceTable', () => {
  it('renders every Bacenta as its own row with present/total counts and formatted currency', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    expect(table.getByText('Grace Bacenta')).toBeInTheDocument();
    expect(table.getByText('Faith Bacenta')).toBeInTheDocument();
    expect(table.getByText('42')).toBeInTheDocument(); // Members
    expect(table.getByText('31 / 42')).toBeInTheDocument(); // Sunday attendance, count/total
    expect(table.getByText('74%')).toBeInTheDocument(); // Sunday attendance %
    expect(table.getByText('28 / 42')).toBeInTheDocument(); // Meeting attendance, count/total
    expect(table.getByText('67%')).toBeInTheDocument(); // Meeting attendance %
    expect(table.getByText('GHS 250.00')).toBeInTheDocument();
  });

  it('shows a plain dash for a missing count and a neutral "Not recorded" badge for its percent/offering - never a fabricated 0', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    // Faith Bacenta: Sunday count dash + Meeting count dash = 2 dashes.
    expect(table.getAllByText('—')).toHaveLength(2);
    // Sunday %, Meeting %, Offering all missing = 3 "Not recorded" badges.
    expect(table.getAllByText('Not recorded')).toHaveLength(3);
  });

  it('defaults to sorting by Sunday Attendance, descending', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    const header = table.getByRole('columnheader', { name: 'Sunday' });
    expect(header).toHaveAttribute('aria-sort', 'descending');
    const rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Grace Bacenta')).toBeInTheDocument(); // real value (31)
    expect(within(rows[2]).getByText('Faith Bacenta')).toBeInTheDocument(); // null - last
  });

  it('re-sorts by a column when its header is clicked, descending by default for a non-name column', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    fireEvent.click(table.getByRole('button', { name: 'Members' }));
    const rows = table.getAllByRole('row');
    // Header row + 2 data rows; sorting by Members descending should put
    // Grace Bacenta (42) before Faith Bacenta (20).
    expect(within(rows[1]).getByText('Grace Bacenta')).toBeInTheDocument();
  });

  it('reverses direction on a second click of the same column header', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    const membersHeader = table.getByRole('button', { name: 'Members' });
    fireEvent.click(membersHeader); // descending: Grace (42) first
    fireEvent.click(membersHeader); // ascending: Faith (20) first
    const rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Faith Bacenta')).toBeInTheDocument();
  });

  it('supports sorting by the percent columns independently of their count columns', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    fireEvent.click(table.getByRole('button', { name: 'Sunday %' }));
    const header = table.getByRole('columnheader', { name: 'Sunday %' });
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('sorts a Bacenta with a missing record (null) last, regardless of sort direction', () => {
    renderTable();
    const table = within(screen.getByTestId('bacenta-performance-table'));
    const sundayHeader = table.getByRole('button', { name: 'Sunday' });

    // Already descending by default.
    let rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Grace Bacenta')).toBeInTheDocument(); // has a real count (31)
    expect(within(rows[2]).getByText('Faith Bacenta')).toBeInTheDocument(); // null - still last

    fireEvent.click(sundayHeader); // ascending
    rows = table.getAllByRole('row');
    expect(within(rows[1]).getByText('Grace Bacenta')).toBeInTheDocument(); // still the only real value, still first
    expect(within(rows[2]).getByText('Faith Bacenta')).toBeInTheDocument(); // still last, not flipped to first
  });

  it('calls onRowClick with the clicked row', () => {
    const onRowClick = jest.fn();
    renderTable({ onRowClick });
    fireEvent.click(screen.getByText('Grace Bacenta'));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it('shows a retryable error state when loading fails', () => {
    const onRetry = jest.fn();
    renderTable({ status: 'error', onRetry });
    expect(screen.getByText("Couldn't load Bacenta performance")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows a compact, non-interactive current-period label (no fake historical picker)', () => {
    renderTable();
    // 2026-01-05 is a Monday; "This Sunday" is 6 days later, 2026-01-11.
    expect(screen.getByText('This Sunday · Jan 11, 2026')).toBeInTheDocument();
  });
});
