import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { RecordPicker } from './RecordPicker';

const RESULTS = [
  { id: 'p1', label: 'Ama Owusu', description: 'Bacenta Leader' },
  { id: 'p2', label: 'Kofi Mensah', description: 'Usher' },
];

describe('RecordPicker', () => {
  it('shows a search trigger when nothing is selected', () => {
    render(<RecordPicker label="Assign Bacenta Leader" value={null} onChange={() => undefined} onSearch={async () => []} />);
    expect(screen.getByRole('button', { name: 'Assign Bacenta Leader' })).toBeTruthy();
  });

  it('shows the selected record with a Change action instead of the trigger', () => {
    render(<RecordPicker label="Assign Bacenta Leader" value={RESULTS[0]} onChange={() => undefined} onSearch={async () => []} />);
    expect(screen.getByText('Ama Owusu')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Change' })).toBeTruthy();
  });

  it('opens the modal, searches, and selects a result', async () => {
    const onSearch = jest.fn().mockResolvedValue(RESULTS);
    const onChange = jest.fn();
    render(<RecordPicker label="Assign Bacenta Leader" value={null} onChange={onChange} onSearch={onSearch} debounceMs={0} />);
    fireEvent.press(screen.getByRole('button', { name: 'Assign Bacenta Leader' }));
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeTruthy());
    fireEvent.press(screen.getByText('Ama Owusu'));
    expect(onChange).toHaveBeenCalledWith(RESULTS[0]);
  });

  it('shows "No matches" once a search resolves empty', async () => {
    const onSearch = jest.fn().mockResolvedValue([]);
    render(<RecordPicker label="Assign Bacenta Leader" value={null} onChange={() => undefined} onSearch={onSearch} debounceMs={0} />);
    fireEvent.press(screen.getByRole('button', { name: 'Assign Bacenta Leader' }));
    fireEvent.changeText(screen.getByLabelText('Search'), 'zzz');
    await waitFor(() => expect(screen.getByText('No matches for "zzz"')).toBeTruthy());
  });
});
