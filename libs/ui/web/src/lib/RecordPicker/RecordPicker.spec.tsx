import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { RecordPicker } from './RecordPicker';

const RESULTS = [
  { id: 'p1', label: 'Ama Owusu', description: 'Bacenta Leader' },
  { id: 'p2', label: 'Kofi Mensah', description: 'Usher' },
];

describe('RecordPicker', () => {
  it('shows a search combobox when nothing is selected', () => {
    render(<RecordPicker label="Bacenta Leader" value={null} onChange={() => undefined} onSearch={async () => []} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows the selected record as a chip with a Change action instead of the input', () => {
    render(<RecordPicker label="Assign Bacenta Leader" value={RESULTS[0]} onChange={() => undefined} onSearch={async () => []} testId="picker" />);
    const chip = within(screen.getByTestId('picker-selected'));
    expect(chip.getByText('Ama Owusu')).toBeInTheDocument();
    expect(chip.getByText('Bacenta Leader')).toBeInTheDocument();
    expect(screen.getByText('Change')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('calls onSearch after debouncing and renders results', async () => {
    const onSearch = jest.fn().mockResolvedValue(RESULTS);
    render(<RecordPicker label="Bacenta Leader" value={null} onChange={() => undefined} onSearch={onSearch} debounceMs={10} />);
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ama' } });
    await waitFor(() => expect(screen.getByRole('option', { name: /Ama Owusu/ })).toBeInTheDocument());
    expect(onSearch).toHaveBeenCalledWith('Ama');
  });

  it('selects a result, calling onChange and closing the dropdown', async () => {
    const onSearch = jest.fn().mockResolvedValue(RESULTS);
    const onChange = jest.fn();
    render(<RecordPicker label="Bacenta Leader" value={null} onChange={onChange} onSearch={onSearch} debounceMs={0} />);
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => expect(screen.getByRole('option', { name: /Ama Owusu/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('option', { name: /Ama Owusu/ }));
    expect(onChange).toHaveBeenCalledWith(RESULTS[0]);
  });

  it('shows "No matches" once a search resolves empty', async () => {
    const onSearch = jest.fn().mockResolvedValue([]);
    render(<RecordPicker label="Bacenta Leader" value={null} onChange={() => undefined} onSearch={onSearch} debounceMs={0} />);
    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
    await waitFor(() => expect(screen.getByText('No matches for "zzz"')).toBeInTheDocument());
  });

  it('announces the error via role="alert"', () => {
    render(<RecordPicker label="Bacenta Leader" value={null} onChange={() => undefined} onSearch={async () => []} error="A Bacenta Leader is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent('A Bacenta Leader is required');
  });
});
