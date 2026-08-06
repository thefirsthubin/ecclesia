import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders its children as accessible button text', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button onPress={onPress}>Verify transaction</Button>);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is disabled and reports busy state while loading', () => {
    const onPress = jest.fn();
    render(
      <Button loading onPress={onPress}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.accessibilityState.busy).toBe(true);
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('uses accessibilityLabel for icon-only buttons', () => {
    render(<Button iconLeft="close" accessibilityLabel="Dismiss" />);
    expect(screen.getByLabelText('Dismiss')).toBeTruthy();
  });
});
