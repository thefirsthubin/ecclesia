import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children as accessible button text', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onClick when pressed', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Verify transaction</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Verify transaction' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and does not call onClick while loading', () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses accessibilityLabel for icon-only buttons', () => {
    render(<Button iconLeft="close" accessibilityLabel="Dismiss" />);
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('respects a disabled prop independent of loading', () => {
    render(<Button disabled>Unavailable</Button>);
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
  });
});
