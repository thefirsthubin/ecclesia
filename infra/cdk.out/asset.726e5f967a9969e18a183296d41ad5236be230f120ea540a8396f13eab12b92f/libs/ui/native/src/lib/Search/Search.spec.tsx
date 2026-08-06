import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Search } from './Search';

describe('Search', () => {
  it('exposes an accessibilityLabel', () => {
    render(<Search label="Search people" value="" onChange={() => undefined} />);
    expect(screen.getByLabelText('Search people')).toBeTruthy();
  });

  it('calls onChange on every keystroke', () => {
    const onChange = jest.fn();
    render(<Search label="Search people" value="" onChange={onChange} />);
    fireEvent.changeText(screen.getByLabelText('Search people'), 'Kwa');
    expect(onChange).toHaveBeenCalledWith('Kwa');
  });

  it('debounces onSearch until typing stops', async () => {
    // Real, short debounce rather than fake timers - see
    // `ToastProvider.spec.tsx`'s note on why fake timers were observed
    // to crash unrelated components elsewhere in this test suite.
    const onSearch = jest.fn();
    const { rerender } = render(<Search label="Search people" value="" onChange={() => undefined} onSearch={onSearch} debounceMs={20} />);
    rerender(<Search label="Search people" value="Kwabena" onChange={() => undefined} onSearch={onSearch} debounceMs={20} />);
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('Kwabena'));
  });

  it('shows a clear button once there is a value and clears on press', () => {
    const onChange = jest.fn();
    const onSearch = jest.fn();
    render(<Search label="Search people" value="Kwabena" onChange={onChange} onSearch={onSearch} debounceMs={0} />);
    fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('does not render a clear button when empty', () => {
    render(<Search label="Search people" value="" onChange={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });
});
