import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

import { AppShell } from './AppShell';
import { NavigationProvider, useCurrentScreen } from './Navigator';

function ScreenProbe() {
  const { screen: current } = useCurrentScreen();
  return <Text testID="current-screen">{current}</Text>;
}

function renderShell(role?: RoleDto) {
  return render(
    <ThemeProvider>
      <NavigationProvider>
        <AppShell role={role}>
          <ScreenProbe />
        </AppShell>
      </NavigationProvider>
    </ThemeProvider>,
  );
}

describe('AppShell', () => {
  it('renders all five Design System §3.2 tabs, with Dashboard active by default', () => {
    renderShell();

    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Attendance' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Follow-ups' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Offering' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
  });

  it('pressing a tab switches the active screen and updates which tab is selected', () => {
    renderShell();

    fireEvent.press(screen.getByRole('tab', { name: 'Profile' }));

    expect(screen.getByTestId('current-screen').props.children).toBe('profile');
    expect(screen.getByRole('tab', { name: 'Profile' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: 'Dashboard' }).props.accessibilityState.selected).toBe(false);
  });

  it('renders its children within the tab area', () => {
    renderShell();
    expect(screen.getByTestId('current-screen')).toBeTruthy();
  });

  // `[Mobile Personas sprint]` `role` now picks which persona's tab set
  // renders - one assertion per new persona, plus the "role with no
  // built persona falls back to the two-tab default" case.
  it('renders the Ministry Leader\'s four tabs for role="BASONTA_LEADER"', () => {
    renderShell('BASONTA_LEADER');
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Roster' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Events' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Attendance' })).toBeNull();
  });

  it('renders the Finance Officer\'s four tabs for role="TREASURER"', () => {
    renderShell('TREASURER');
    expect(screen.getByRole('tab', { name: 'Verify' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Reconcile' })).toBeTruthy();
  });

  it('renders the Resident Pastor\'s four tabs for role="RESIDENT_PASTOR" and role="ACTING_RESIDENT_PASTOR"', () => {
    renderShell('RESIDENT_PASTOR');
    expect(screen.getByRole('tab', { name: 'Alerts' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Branch' })).toBeTruthy();
  });

  it('renders the Usher\'s four tabs for role="USHER"', () => {
    renderShell('USHER');
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Attendance' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Visitor Intake' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
  });

  it('falls back to the two-tab default (Dashboard, Profile) for a role with no built persona', () => {
    renderShell('ADMIN');
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Verify' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Attendance' })).toBeNull();
  });
});
