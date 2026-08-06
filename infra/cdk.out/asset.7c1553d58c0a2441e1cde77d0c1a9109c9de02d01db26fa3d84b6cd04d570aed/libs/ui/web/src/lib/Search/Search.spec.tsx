import { render, screen, fireEvent } from '@testing-library/react';
import { Search } from './Search';

describe('Search', () => {
  it('exposes an accessible name via aria-label', () => {
    render(<Search label="Search people" value="" onChange={() => undefined} />);
    expect(screen.getByLabelText('Search people')).toBeInTheDocument();
  });

  it('calls onChange on every keystroke', () => {
    const onChange = jest.fn();
    render(<Search label="Search people" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search people'), { target: { value: 'Kwa' } });
    expect(onChange).toHaveBeenCalledWith('Kwa');
  });

  it('debounces onSearch until typing stops', () => {
    jest.useFakeTimers();
    const onSearch = jest.fn();
    const { rerender } = render(<Search label="Search people" value="" onChange={() => undefined} onSearch={onSearch} debounceMs={300} />);
    rerender(<Search label="Search people" value="Kwabena" onChange={() => undefined} onSearch={onSearch} debounceMs={300} />);
    expect(onSearch).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('Kwabena');
    jest.useRealTimers();
  });

  it('shows a clear button once there is a value and clears on click', () => {
    const onChange = jest.fn();
    const onSearch = jest.fn();
    render(<Search label="Search people" value="Kwabena" onChange={onChange} onSearch={onSearch} debounceMs={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenCalledWith('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('does not render a clear button when empty', () => {
    render(<Search label="Search people" value="" onChange={() => undefined} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });
});
