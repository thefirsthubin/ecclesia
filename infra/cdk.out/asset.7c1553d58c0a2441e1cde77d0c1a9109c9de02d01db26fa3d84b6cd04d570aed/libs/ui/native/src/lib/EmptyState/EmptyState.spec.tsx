import { render, screen, fireEvent } from '@testing-library/react-native';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No members yet" />);
    expect(screen.getByText('No members yet')).toBeTruthy();
  });

  it('renders the description', () => {
    render(<EmptyState title="No members yet" description="Add your first member to get started." />);
    expect(screen.getByText('Add your first member to get started.')).toBeTruthy();
  });

  it('fires the action callback when pressed', () => {
    const onPress = jest.fn();
    render(<EmptyState title="No members yet" action={{ label: 'Add member', onPress }} />);
    fireEvent.press(screen.getByText('Add member'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
