import { render, screen, fireEvent } from '@testing-library/react-native';
import { Select } from './Select';

const OPTIONS = [
  { value: 'youth', label: 'Youth Ministry' },
  { value: 'ushering', label: 'Ushering' },
];

describe('Select', () => {
  it('shows the placeholder when nothing is selected', () => {
    render(<Select label="Ministry" options={OPTIONS} value={null} onChange={() => undefined} placeholder="Select a Ministry" />);
    expect(screen.getByText('Select a Ministry')).toBeTruthy();
  });

  it('shows the selected option label on the trigger', () => {
    render(<Select label="Ministry" options={OPTIONS} value="ushering" onChange={() => undefined} />);
    expect(screen.getByText('Ushering')).toBeTruthy();
  });

  it('opens the option list on press and calls onChange when an option is picked', () => {
    const onChange = jest.fn();
    render(<Select label="Ministry" options={OPTIONS} value={null} onChange={onChange} />);
    fireEvent.press(screen.getByRole('button', { name: 'Ministry' }));
    fireEvent.press(screen.getByText('Youth Ministry'));
    expect(onChange).toHaveBeenCalledWith('youth');
  });

  it('shows helper/error text below the trigger', () => {
    render(<Select label="Ministry" options={OPTIONS} value={null} onChange={() => undefined} error="Ministry is required" />);
    expect(screen.getByText('Ministry is required')).toBeTruthy();
  });
});
