import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Tabs } from './Tabs';

const TABS = [
  { id: 'pledges', label: 'Pledges', content: <Text>Pledge list</Text> },
  { id: 'deposits', label: 'Deposits', content: <Text>Deposit list</Text> },
];

describe('Tabs', () => {
  it('exposes each tab with accessibilityRole="tab" and marks the active one selected', () => {
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={() => undefined} />);
    expect(screen.getByRole('tab', { name: 'Pledges' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Deposits' }).props.accessibilityState.selected).toBe(false);
  });

  it('renders only the active tab content', () => {
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={() => undefined} />);
    expect(screen.getByText('Pledge list')).toBeTruthy();
    expect(screen.queryByText('Deposit list')).toBeNull();
  });

  it('calls onChange when a tab is pressed', () => {
    const onChange = jest.fn();
    render(<Tabs tabs={TABS} activeTabId="pledges" onChange={onChange} />);
    fireEvent.press(screen.getByRole('tab', { name: 'Deposits' }));
    expect(onChange).toHaveBeenCalledWith('deposits');
  });
});
