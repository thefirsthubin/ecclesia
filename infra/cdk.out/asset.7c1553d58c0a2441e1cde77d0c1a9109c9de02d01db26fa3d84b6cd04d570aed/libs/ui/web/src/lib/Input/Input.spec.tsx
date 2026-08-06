import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input', () => {
  it('associates a real <label> with the input (not a placeholder)', () => {
    render(<Input label="Phone number" placeholder="055 000 0000" />);
    expect(screen.getByLabelText('Phone number')).toBeInTheDocument();
  });

  it('accepts and reflects typed input', () => {
    render(<Input label="Name" onChange={() => undefined} />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Kwabena' } });
    expect(input.value).toBe('Kwabena');
  });

  it('marks the field invalid and announces the error via role="alert"', () => {
    render(<Input label="Amount" error="Amount must be greater than zero" />);
    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Amount must be greater than zero');
  });

  it('shows helper text when there is no error', () => {
    render(<Input label="Note" helperText="Visible to your Pastor only" />);
    expect(screen.getByText('Visible to your Pastor only')).toBeInTheDocument();
  });
});
