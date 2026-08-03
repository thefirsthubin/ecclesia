import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { NavigationProvider, useCurrentScreen, useGoBack, useNavigate } from './Navigator';

// `@testing-library/react-native`'s auto-registered matchers (v12+, see
// `test-setup.ts`) don't include `toHaveTextContent` (a DOM-Testing-
// Library matcher with no RN equivalent shipped here) - reading a `Text`
// node's rendered string back via its own `children` prop is this
// workspace's RN-side substitute (`ShepherdDashboardScreen.spec.tsx`
// instead relies on `getByText` directly; a probe component with dynamic
// state needs this reverse lookup by testId instead).
function textOf(testId: string): string {
  return String(screen.getByTestId(testId).props.children);
}

function Probe() {
  const navigate = useNavigate();
  const { goBack, canGoBack } = useGoBack();
  const { screen: current, params } = useCurrentScreen();
  return (
    <>
      <Text testID="current-screen">{current}</Text>
      <Text testID="params-gathering-id">{params.gatheringId ?? ''}</Text>
      <Text testID="can-go-back">{String(canGoBack)}</Text>
      <Text testID="navigate" onPress={() => navigate('attendance-capture', { gatheringId: 'g-1' })}>
        navigate
      </Text>
      <Text testID="go-back" onPress={() => goBack()}>
        go-back
      </Text>
    </>
  );
}

describe('Navigator', () => {
  it('starts on the dashboard screen with no history to go back to', () => {
    render(
      <NavigationProvider>
        <Probe />
      </NavigationProvider>,
    );
    expect(textOf('current-screen')).toBe('dashboard');
    expect(textOf('can-go-back')).toBe('false');
  });

  it('navigate() pushes a new screen with params, and goBack() pops it', () => {
    render(
      <NavigationProvider>
        <Probe />
      </NavigationProvider>,
    );

    fireEvent.press(screen.getByTestId('navigate'));
    expect(textOf('current-screen')).toBe('attendance-capture');
    expect(textOf('params-gathering-id')).toBe('g-1');
    expect(textOf('can-go-back')).toBe('true');

    fireEvent.press(screen.getByTestId('go-back'));
    expect(textOf('current-screen')).toBe('dashboard');
    expect(textOf('can-go-back')).toBe('false');
  });

  it('goBack() is a no-op at the root of the stack', () => {
    render(
      <NavigationProvider>
        <Probe />
      </NavigationProvider>,
    );
    fireEvent.press(screen.getByTestId('go-back'));
    expect(textOf('current-screen')).toBe('dashboard');
  });

  it('useNavigate/useGoBack/useCurrentScreen throw outside a NavigationProvider', () => {
    // Swallow the expected React error-boundary console.error noise this
    // throw-during-render produces, matching this workspace's other
    // "throws outside its provider" tests (e.g. AuthContext's useAuth).
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(/must be used within a NavigationProvider/);
    consoleError.mockRestore();
  });
});
