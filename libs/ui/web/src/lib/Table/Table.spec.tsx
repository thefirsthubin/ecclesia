import { render, screen, fireEvent } from '@testing-library/react';
import { Table, type TableColumn } from './Table';

interface Person {
  id: string;
  name: string;
  role: string;
}

const PEOPLE: Person[] = [
  { id: 'p1', name: 'Ama Owusu', role: 'Bacenta Leader' },
  { id: 'p2', name: 'Kofi Mensah', role: 'Usher' },
];

const COLUMNS: TableColumn<Person>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name, sortable: true },
  { key: 'role', header: 'Role', render: (row) => row.role },
];

describe('Table', () => {
  it('renders a real <table> with column headers and row data', () => {
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByText('Ama Owusu')).toBeInTheDocument();
    expect(screen.getByText('Usher')).toBeInTheDocument();
  });

  it('renders an EmptyState when there are no rows and not loading', () => {
    render(<Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} emptyTitle="No people found" />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('No people found')).toBeInTheDocument();
  });

  it('renders skeleton placeholder rows while loading', () => {
    render(<Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} loading />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.queryByText('No people found')).not.toBeInTheDocument();
  });

  it('calls onSortChange and sets aria-sort when a sortable header is clicked', () => {
    const onSortChange = jest.fn();
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} sortKey="name" sortDirection="asc" onSortChange={onSortChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Name/ }));
    expect(onSortChange).toHaveBeenCalledWith('name');
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  });

  it('calls onRowClick with the clicked row', () => {
    const onRowClick = jest.fn();
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText('Ama Owusu'));
    expect(onRowClick).toHaveBeenCalledWith(PEOPLE[0]);
  });

  it('makes clickable rows keyboard-activatable (focusable, Enter/Space triggers onRowClick)', () => {
    const onRowClick = jest.fn();
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} onRowClick={onRowClick} />);
    const row = screen.getByText('Ama Owusu').closest('tr') as HTMLElement;
    expect(row).toHaveAttribute('tabIndex', '0');
    expect(row).toHaveAttribute('role', 'button');
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(onRowClick).toHaveBeenCalledWith(PEOPLE[0]);
    fireEvent.keyDown(row, { key: ' ' });
    expect(onRowClick).toHaveBeenCalledTimes(2);
  });

  it('does not add row-level tabIndex/role when onRowClick is absent', () => {
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} />);
    const row = screen.getByText('Ama Owusu').closest('tr') as HTMLElement;
    expect(row).not.toHaveAttribute('tabIndex');
    expect(row).not.toHaveAttribute('role');
  });

  it('supports row selection with a "select all" checkbox', () => {
    const onSelectionChange = jest.fn();
    render(
      <Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} selectedIds={new Set()} onSelectionChange={onSelectionChange} />,
    );
    fireEvent.click(screen.getByLabelText('Select all rows'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['p1', 'p2']));
  });

  describe('expandable row detail', () => {
    it('renders a full-width detail row only beneath the row isRowExpanded matches', () => {
      render(
        <Table
          columns={COLUMNS}
          data={PEOPLE}
          getRowId={(row) => row.id}
          isRowExpanded={(row) => row.id === 'p1'}
          renderRowDetail={(row) => <span>{`Escalate form for ${row.name}`}</span>}
        />,
      );
      expect(screen.getByText('Escalate form for Ama Owusu')).toBeInTheDocument();
      expect(screen.queryByText('Escalate form for Kofi Mensah')).not.toBeInTheDocument();
    });

    it('spans every column via colSpan, including the selection checkbox column', () => {
      render(
        <Table
          columns={COLUMNS}
          data={PEOPLE}
          getRowId={(row) => row.id}
          selectedIds={new Set()}
          onSelectionChange={jest.fn()}
          isRowExpanded={(row) => row.id === 'p1'}
          renderRowDetail={() => <span>Detail</span>}
        />,
      );
      const detailCell = screen.getByText('Detail').closest('td');
      expect(detailCell).toHaveAttribute('colSpan', '3');
    });

    it('renders no detail row at all when isRowExpanded is never true', () => {
      render(
        <Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} isRowExpanded={() => false} renderRowDetail={() => <span>Detail</span>} />,
      );
      expect(screen.queryByText('Detail')).not.toBeInTheDocument();
    });
  });
});
