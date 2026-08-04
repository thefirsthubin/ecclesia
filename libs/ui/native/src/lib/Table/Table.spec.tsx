import { render, screen, fireEvent } from '@testing-library/react-native';
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
  it('renders column headers and row data', () => {
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} />);
    expect(screen.getByText('Name')).toBeTruthy();
    expect(screen.getByText('Ama Owusu')).toBeTruthy();
    expect(screen.getByText('Usher')).toBeTruthy();
  });

  it('renders an EmptyState when there are no rows and not loading', () => {
    render(<Table columns={COLUMNS} data={[]} getRowId={(row) => row.id} emptyTitle="No people found" />);
    expect(screen.getByText('No people found')).toBeTruthy();
  });

  it('calls onSortChange when a sortable header is pressed', () => {
    const onSortChange = jest.fn();
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} sortKey="name" onSortChange={onSortChange} />);
    fireEvent.press(screen.getByRole('button', { name: 'Sort by Name' }));
    expect(onSortChange).toHaveBeenCalledWith('name');
  });

  it('calls onRowClick with the pressed row', () => {
    const onRowClick = jest.fn();
    render(<Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} onRowClick={onRowClick} />);
    fireEvent.press(screen.getByText('Ama Owusu'));
    expect(onRowClick).toHaveBeenCalledWith(PEOPLE[0]);
  });

  it('supports row selection with a "select all" checkbox', () => {
    const onSelectionChange = jest.fn();
    render(
      <Table columns={COLUMNS} data={PEOPLE} getRowId={(row) => row.id} selectedIds={new Set()} onSelectionChange={onSelectionChange} />,
    );
    fireEvent.press(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(['p1', 'p2']));
  });
});
