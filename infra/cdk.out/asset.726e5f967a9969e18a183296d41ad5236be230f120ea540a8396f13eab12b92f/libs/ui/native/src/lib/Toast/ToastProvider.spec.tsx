import { render, screen, waitFor } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import { ToastProvider, useToast } from './ToastProvider';

function ShowOnMount({ message, duration }: { message: string; duration?: number }) {
  const { show } = useToast();
  useEffect(() => {
    // Intentionally runs once on mount only, using whatever `show`
    // identity was captured at mount - this repo has no
    // `eslint-plugin-react-hooks` installed, so there is no
    // exhaustive-deps rule to satisfy or suppress here.
    show({ message, duration });
  }, []);
  return <Text>host</Text>;
}

describe('ToastProvider / useToast', () => {
  it('renders a shown toast message', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="Deposit reconciled" duration={0} />
      </ToastProvider>,
    );
    expect(screen.getByText('Deposit reconciled')).toBeTruthy();
  });

  it('auto-dismisses after the given duration', async () => {
    // Uses a short *real* timeout rather than `jest.useFakeTimers()` -
    // this project's RN preset runs `Skeleton`'s `Animated.loop` on real
    // JS timers elsewhere in this same test suite, and force-advancing
    // fake timers here was observed to crash an unrelated, already-
    // unmounted `Skeleton` during passive-effect cleanup ("commit phase
    // error inside a detached tree"). A real, small duration sidesteps
    // that interaction entirely rather than trying to reconcile it.
    render(
      <ToastProvider>
        <ShowOnMount message="Saved" duration={30} />
      </ToastProvider>,
    );
    expect(screen.getByText('Saved')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Saved')).toBeNull());
  });

  it('throws when useToast is called outside a ToastProvider', () => {
    const Broken = () => {
      useToast();
      return null;
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Broken />)).toThrow('useToast must be used within a ToastProvider');
    consoleError.mockRestore();
  });
});
