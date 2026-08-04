import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { AppShell } from './AppShell';
import { NavigationProvider, useCurrentScreen } from './Navigator';

function ScreenProbe() {
  const { screen: current } = useCurrentScreen();
  return <Text testID="current-screen">{current}</Text>;
}

function renderShell() {
  return render(
    <ThemeProvider>
      <NavigationProvider>
        <AppShell>
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
});
