import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from './Select';

const OPTIONS = [
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'ushering', label: 'Ushering' },
];

describe('Select', () => {
  it('associates a real <label> with the select element', () => {
    render(<Select label="Ministry" options={OPTIONS} onChange={() => undefined} />);
    expect(screen.getByLabelText('Ministry')).toBeInTheDocument();
    expect(screen.getByLabelText('Ministry').tagName).toBe('SELECT');
  });

  it('renders every option plus an optional disabled placeholder', () => {
    render(<Select label="Ministry" options={OPTIONS} placeholder="Select a Ministry" onChange={() => undefined} />);
    expect(screen.getByRole('option', { name: 'Select a Ministry' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Youth Ministry' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ushering' })).toBeInTheDocument();
  });

  it('fires onChange with the selected value', () => {
    const onChange = jest.fn();
    render(<Select label="Ministry" options={OPTIONS} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Ministry'), { target: { value: 'ushering' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('marks the field invalid and announces the error via role="alert"', () => {
    render(<Select label="Ministry" options={OPTIONS} error="Ministry is required" onChange={() => undefined} />);
    expect(screen.getByLabelText('Ministry')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Ministry is required');
  });
});
