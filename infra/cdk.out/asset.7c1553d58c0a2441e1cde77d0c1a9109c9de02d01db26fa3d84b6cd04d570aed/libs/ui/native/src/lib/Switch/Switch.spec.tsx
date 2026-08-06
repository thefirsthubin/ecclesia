import { render, screen, fireEvent } from '@testing-library/react-native';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders the label as visible text and mirrors it as accessibilityLabel on the control', () => {
    render(<Switch label="Email notifications" checked onChange={() => undefined} />);
    expect(screen.getByText('Email notifications')).toBeTruthy();
    expect(screen.getByLabelText('Email notifications')).toBeTruthy();
  });

  it('calls onChange with the toggled value', () => {
    const onChange = jest.fn();
    render(<Switch label="SMS alerts" checked={false} onChange={onChange} />);
    fireEvent(screen.getByLabelText('SMS alerts'), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('shows helper text when provided', () => {
    render(<Switch label="Auto-escalate" checked={false} onChange={() => undefined} helperText="Applies to new flags only" />);
    expect(screen.getByText('Applies to new flags only')).toBeTruthy();
  });
});
