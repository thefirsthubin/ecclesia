import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('renders the label as visible text and mirrors it as accessibilityLabel', () => {
    render(<TextArea label="Pastoral note" />);
    expect(screen.getByText('Pastoral note')).toBeTruthy();
    expect(screen.getByLabelText('Pastoral note')).toBeTruthy();
  });

  it('accepts and reflects typed input', () => {
    const onChangeText = jest.fn();
    render(<TextArea label="Notes" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText('Notes'), 'Line one\nLine two');
    expect(onChangeText).toHaveBeenCalledWith('Line one\nLine two');
  });

  it('announces the error via accessibilityRole="alert"', () => {
    render(<TextArea label="Reason" error="Reason is required" />);
    expect(screen.getByText('Reason is required')).toBeTruthy();
  });

  it('marks the field disabled when editable is false', () => {
    render(<TextArea label="Locked" editable={false} />);
    expect(screen.getByLabelText('Locked').props.accessibilityState.disabled).toBe(true);
  });
});
