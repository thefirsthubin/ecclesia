import { render, screen, fireEvent } from '@testing-library/react-native';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('exposes accessibilityRole="checkbox" with the label text', () => {
    render(<Checkbox label="Send SMS reminder" checked={false} onChange={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: 'Send SMS reminder' })).toBeTruthy();
  });

  it('calls onChange with the toggled value on press', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Opt in" checked={false} onChange={onChange} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Opt in' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports accessibilityState.checked as "mixed" when indeterminate', () => {
    render(<Checkbox label="Select all" checked={false} indeterminate onChange={() => undefined} />);
    expect(screen.getByRole('checkbox', { name: 'Select all' }).props.accessibilityState.checked).toBe('mixed');
  });

  it('does not call onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Locked" checked={false} disabled onChange={onChange} />);
    fireEvent.press(screen.getByRole('checkbox', { name: 'Locked' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
