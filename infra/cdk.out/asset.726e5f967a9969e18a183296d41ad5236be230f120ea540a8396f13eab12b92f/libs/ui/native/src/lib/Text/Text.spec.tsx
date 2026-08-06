import { render, screen } from '@testing-library/react-native';
import { Text } from './Text';

describe('Text', () => {
  it('renders children', () => {
    render(<Text>Hello Ecclesia</Text>);
    expect(screen.getByText('Hello Ecclesia')).toBeTruthy();
  });

  it('forwards a testId as testID', () => {
    render(<Text testId="my-text">x</Text>);
    expect(screen.getByTestId('my-text')).toBeTruthy();
  });
});
