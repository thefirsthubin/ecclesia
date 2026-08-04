import { render, screen, fireEvent } from '@testing-library/react-native';
import { BottomNav } from './BottomNav';

const ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' as const, active: true },
  { key: 'people', label: 'People', icon: 'users' as const, active: false },
];

describe('BottomNav', () => {
  it('exposes accessibilityRole="tablist" with each item as a "tab"', () => {
    // `@testing-library/react-native`'s `getByRole` doesn't support
    // querying by `"tablist"` (its supported-role list is a subset of
    // RN's real `AccessibilityRole` values - `"tab"` is supported,
    // `"tablist"` isn't), so the container's role is asserted directly
    // via its props instead of a role query.
    render(<BottomNav items={ITEMS} onPress={() => undefined} testId="bottom-nav" />);
    expect(screen.getByTestId('bottom-nav').props.accessibilityRole).toBe('tablist');
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'People' })).toBeTruthy();
  });

  it('marks the active item as selected', () => {
    render(<BottomNav items={ITEMS} onPress={() => undefined} />);
    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'People' }).props.accessibilityState.selected).toBe(false);
  });

  it('calls onPress with the pressed item key', () => {
    const onPress = jest.fn();
    render(<BottomNav items={ITEMS} onPress={onPress} />);
    fireEvent.press(screen.getByRole('tab', { name: 'People' }));
    expect(onPress).toHaveBeenCalledWith('people');
  });
});
