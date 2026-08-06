import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders the title', () => {
    render(<ErrorState title="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('fires onRetry when the retry button is pressed', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Something went wrong" onRetry={onRetry} />);
    fireEvent.press(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button when onRetry is not given', () => {
    render(<ErrorState title="Something went wrong" />);
    expect(screen.queryByText('Retry')).toBeNull();
  });
});
