import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FilterBar } from './FilterBar';

const FILTERS = [
  { id: 'branch', label: 'Branch: Accra Central' },
  { id: 'status', label: 'Status: Overdue' },
];

describe('FilterBar', () => {
  it('renders null when there are no filters and no trailing content', () => {
    const { toJSON } = render(<FilterBar filters={[]} onRemove={() => undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('renders a chip per active filter', () => {
    render(<FilterBar filters={FILTERS} onRemove={() => undefined} />);
    expect(screen.getByText('Branch: Accra Central')).toBeTruthy();
    expect(screen.getByText('Status: Overdue')).toBeTruthy();
  });

  it('calls onRemove with the chip id when pressed', () => {
    const onRemove = jest.fn();
    render(<FilterBar filters={FILTERS} onRemove={onRemove} />);
    fireEvent.press(screen.getByLabelText('Remove filter: Branch: Accra Central'));
    expect(onRemove).toHaveBeenCalledWith('branch');
  });

  it('shows "Clear all" only when there are filters and calls onClearAll', () => {
    const onClearAll = jest.fn();
    render(<FilterBar filters={FILTERS} onRemove={() => undefined} onClearAll={onClearAll} />);
    fireEvent.press(screen.getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('renders trailing children even when there are no filters', () => {
    render(
      <FilterBar filters={[]} onRemove={() => undefined}>
        <Text>Add filter</Text>
      </FilterBar>,
    );
    expect(screen.getByText('Add filter')).toBeTruthy();
  });
});
