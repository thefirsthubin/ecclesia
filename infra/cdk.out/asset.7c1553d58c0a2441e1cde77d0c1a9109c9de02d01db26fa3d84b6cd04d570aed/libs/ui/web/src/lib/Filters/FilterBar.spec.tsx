import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from './FilterBar';

const FILTERS = [
  { id: 'branch', label: 'Branch: Accra Central' },
  { id: 'status', label: 'Status: Overdue' },
];

describe('FilterBar', () => {
  it('renders nothing when there are no filters and no trailing content', () => {
    const { container } = render(<FilterBar filters={[]} onRemove={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a chip per active filter', () => {
    render(<FilterBar filters={FILTERS} onRemove={() => undefined} />);
    expect(screen.getByText('Branch: Accra Central')).toBeInTheDocument();
    expect(screen.getByText('Status: Overdue')).toBeInTheDocument();
  });

  it('calls onRemove with the chip id when its remove button is clicked', () => {
    const onRemove = jest.fn();
    render(<FilterBar filters={FILTERS} onRemove={onRemove} />);
    fireEvent.click(screen.getByLabelText('Remove filter: Branch: Accra Central'));
    expect(onRemove).toHaveBeenCalledWith('branch');
  });

  it('shows "Clear all" only when there are filters and calls onClearAll', () => {
    const onClearAll = jest.fn();
    render(<FilterBar filters={FILTERS} onRemove={() => undefined} onClearAll={onClearAll} />);
    fireEvent.click(screen.getByText('Clear all'));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('does not show "Clear all" when there are no filters', () => {
    render(<FilterBar filters={[]} onRemove={() => undefined} onClearAll={() => undefined}><span>Add filter</span></FilterBar>);
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument();
  });
});
