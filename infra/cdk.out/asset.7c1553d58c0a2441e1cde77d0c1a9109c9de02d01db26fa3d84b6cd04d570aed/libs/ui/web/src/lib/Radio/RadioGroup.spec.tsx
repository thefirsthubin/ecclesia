import { render, screen, fireEvent } from '@testing-library/react';
import { RadioGroup } from './RadioGroup';

const OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'bank', label: 'Bank transfer' },
];

describe('RadioGroup', () => {
  it('renders a real <fieldset>/<legend> grouping every option', () => {
    render(<RadioGroup label="Payment method" name="payment" options={OPTIONS} value={null} onChange={() => undefined} />);
    expect(screen.getByRole('group', { name: 'Payment method' })).toBeInTheDocument();
    expect(screen.getByLabelText('Cash')).toBeInTheDocument();
    expect(screen.getByLabelText('Mobile Money')).toBeInTheDocument();
    expect(screen.getByLabelText('Bank transfer')).toBeInTheDocument();
  });

  it('marks exactly the selected option as checked', () => {
    render(<RadioGroup label="Payment method" name="payment" options={OPTIONS} value="momo" onChange={() => undefined} />);
    expect((screen.getByLabelText('Mobile Money') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText('Cash') as HTMLInputElement).checked).toBe(false);
  });

  it('calls onChange with the newly selected value', () => {
    const onChange = jest.fn();
    render(<RadioGroup label="Payment method" name="payment" options={OPTIONS} value="cash" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Bank transfer'));
    expect(onChange).toHaveBeenCalledWith('bank');
  });

  it('announces the error via role="alert"', () => {
    render(
      <RadioGroup label="Payment method" name="payment" options={OPTIONS} value={null} onChange={() => undefined} error="Select a payment method" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Select a payment method');
  });
});
