import { render, screen, fireEvent } from '@testing-library/react-native';
import { RadioGroup } from './RadioGroup';

const OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money' },
];

describe('RadioGroup', () => {
  it('exposes each option with accessibilityRole="radio"', () => {
    render(<RadioGroup label="Payment method" options={OPTIONS} value={null} onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: 'Cash' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Mobile Money' })).toBeTruthy();
  });

  it('marks exactly the selected option checked', () => {
    render(<RadioGroup label="Payment method" options={OPTIONS} value="momo" onChange={() => undefined} />);
    expect(screen.getByRole('radio', { name: 'Mobile Money' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('radio', { name: 'Cash' }).props.accessibilityState.checked).toBe(false);
  });

  it('calls onChange with the pressed option value', () => {
    const onChange = jest.fn();
    render(<RadioGroup label="Payment method" options={OPTIONS} value="cash" onChange={onChange} />);
    fireEvent.press(screen.getByRole('radio', { name: 'Mobile Money' }));
    expect(onChange).toHaveBeenCalledWith('momo');
  });
});
