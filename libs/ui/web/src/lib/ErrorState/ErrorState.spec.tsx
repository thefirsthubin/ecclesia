import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('announces itself via role="alert"', () => {
    render(<ErrorState title="Could not load dashboard" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load dashboard');
  });

  it('renders a Retry button and calls onRetry when pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Could not load dashboard" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render a Retry button when onRetry is not given', () => {
    render(<ErrorState title="Could not load dashboard" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
