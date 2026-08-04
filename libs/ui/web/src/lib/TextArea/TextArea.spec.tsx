import { render, screen, fireEvent } from '@testing-library/react';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('associates a real <label> with the textarea (not a placeholder)', () => {
    render(<TextArea label="Pastoral note" placeholder="What happened during the visit?" />);
    expect(screen.getByLabelText('Pastoral note')).toBeInTheDocument();
  });

  it('accepts and reflects typed input across multiple lines', () => {
    render(<TextArea label="Notes" onChange={() => undefined} />);
    const field = screen.getByLabelText('Notes') as HTMLTextAreaElement;
    fireEvent.change(field, { target: { value: 'Line one\nLine two' } });
    expect(field.value).toBe('Line one\nLine two');
  });

  it('marks the field invalid and announces the error via role="alert"', () => {
    render(<TextArea label="Reason" error="Reason is required" />);
    expect(screen.getByLabelText('Reason')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Reason is required');
  });

  it('shows helper text when there is no error', () => {
    render(<TextArea label="Note" helperText="Visible to your Pastor only" />);
    expect(screen.getByText('Visible to your Pastor only')).toBeInTheDocument();
  });
});
