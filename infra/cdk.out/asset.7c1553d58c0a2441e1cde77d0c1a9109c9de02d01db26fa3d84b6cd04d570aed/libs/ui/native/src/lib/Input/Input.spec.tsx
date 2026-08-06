import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from './Input';

describe('Input', () => {
  it('renders the label text', () => {
    render(<Input label="Phone number" />);
    expect(screen.getByText('Phone number')).toBeTruthy();
  });

  it('exposes the label as the accessible name of the field', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toBeTruthy();
  });

  it('accepts typed input', () => {
    const onChangeText = jest.fn();
    render(<Input label="Name" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Name'), 'Kwabena');
    expect(onChangeText).toHaveBeenCalledWith('Kwabena');
  });

  it('renders an error message', () => {
    render(<Input label="Amount" error="Amount must be greater than zero" />);
    expect(screen.getByText('Amount must be greater than zero')).toBeTruthy();
  });
});
