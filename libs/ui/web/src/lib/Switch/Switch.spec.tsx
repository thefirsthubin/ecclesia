import { render, screen, fireEvent } from '@testing-library/react';
import { Switch } from './Switch';

describe('Switch', () => {
  it('exposes role="switch" and aria-checked reflecting the checked prop', () => {
    render(<Switch label="Email notifications" checked onChange={() => undefined} />);
    const control = screen.getByRole('switch', { name: 'Email notifications' });
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with the toggled value on click', () => {
    const onChange = jest.fn();
    render(<Switch label="SMS alerts" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'SMS alerts' }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not fire onChange when disabled', () => {
    const onChange = jest.fn();
    render(<Switch label="Locked setting" checked={false} disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Locked setting' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows helper text when provided', () => {
    render(<Switch label="Auto-escalate" checked={false} onChange={() => undefined} helperText="Applies to new flags only" />);
    expect(screen.getByText('Applies to new flags only')).toBeInTheDocument();
  });
});
