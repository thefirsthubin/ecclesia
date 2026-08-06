import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('associates a real <label> with the checkbox input', () => {
    render(<Checkbox label="Send SMS reminder" onChange={() => undefined} />);
    expect(screen.getByLabelText('Send SMS reminder')).toBeInTheDocument();
    expect(screen.getByLabelText('Send SMS reminder')).toHaveAttribute('type', 'checkbox');
  });

  it('fires onChange when clicked', () => {
    const onChange = jest.fn();
    render(<Checkbox label="Opt in" checked={false} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Opt in'));
    expect(onChange).toHaveBeenCalled();
  });

  it('reflects the indeterminate state on the underlying input', () => {
    render(<Checkbox label="Select all" checked={false} indeterminate onChange={() => undefined} />);
    const box = screen.getByLabelText('Select all') as HTMLInputElement;
    expect(box.indeterminate).toBe(true);
  });

  it('marks the field invalid and announces the error via role="alert"', () => {
    render(<Checkbox label="Agree to terms" error="You must agree to continue" onChange={() => undefined} />);
    expect(screen.getByLabelText('Agree to terms')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('You must agree to continue');
  });
});
