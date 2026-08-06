import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <Text>Bacenta 12</Text>
      </Card>,
    );
    expect(screen.getByText('Bacenta 12')).toBeTruthy();
  });

  it('is not a button role by default', () => {
    render(
      <Card>
        <Text>Static</Text>
      </Card>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('responds to press when interactive', () => {
    const onPress = jest.fn();
    render(
      <Card interactive onPress={onPress} testId="card">
        <Text>Open</Text>
      </Card>,
    );
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
