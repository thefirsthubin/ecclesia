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

  it('supports row selection with a "select all" checkbox', () => {
    const onSelectionChange = jest.fn();
    render(
      <Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} selectedIds={new Set()} onSelectionChange={onSelectionChange} />,
    );
    fireEvent.click(screen.getByLabelText('Select all rows'));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['p1', 'p2']));
  });
});
