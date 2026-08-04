import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from './CommandPalette';

function buildItems(onSelect: jest.Mock) {
  return [
    { id: 'people', label: 'Go to People', group: 'Navigate', onSelect: () => onSelect('people') },
    { id: 'gatherings', label: 'Go to Gatherings', group: 'Navigate', onSelect: () => onSelect('gatherings') },
    { id: 'new-person', label: 'Add new Person', group: 'Actions', onSelect: () => onSelect('new-person') },
  ];
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette isOpen={false} onClose={() => undefined} items={buildItems(jest.fn())} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders every item as an option when open', () => {
    render(<CommandPalette isOpen onClose={() => undefined} items={buildItems(jest.fn())} />);
    expect(screen.getByRole('option', { name: 'Go to People' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Add new Person' })).toBeInTheDocument();
  });

  it('filters options as the query changes', () => {
    render(<CommandPalette isOpen onClose={() => undefined} items={buildItems(jest.fn())} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'gathering' } });
    expect(screen.getByRole('option', { name: 'Go to Gatherings' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Go to People' })).not.toBeInTheDocument();
  });

  it('activates the highlighted item on Enter and closes', () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    render(<CommandPalette isOpen onClose={onClose} items={buildItems(onSelect)} />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('gatherings');
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    const onClose = jest.fn();
    render(<CommandPalette isOpen onClose={onClose} items={buildItems(jest.fn())} />);
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows "No matches" when the query matches nothing', () => {
    render(<CommandPalette isOpen onClose={() => undefined} items={buildItems(jest.fn())} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });
});
