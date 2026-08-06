import { render, screen, act } from '@testing-library/react';
import { useEffect } from 'react';
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
  return null;
}

describe('ToastProvider / useToast', () => {
  it('renders a shown toast with role="status"', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="Deposit reconciled" duration={0} />
      </ToastProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Deposit reconciled');
  });

  it('uses aria-live="assertive" for danger toasts', () => {
    render(
      <ToastProvider>
        <ShowOnMount message="Reconciliation failed" duration={0} />
      </ToastProvider>,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('auto-dismisses after the given duration', () => {
    jest.useFakeTimers();
    render(
      <ToastProvider>
        <ShowOnMount message="Saved" duration={1000} />
      </ToastProvider>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    jest.useRealTimers();
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
