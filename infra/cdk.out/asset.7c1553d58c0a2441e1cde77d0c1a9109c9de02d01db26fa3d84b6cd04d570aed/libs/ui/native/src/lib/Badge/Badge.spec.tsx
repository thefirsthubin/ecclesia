import { render, screen } from '@testing-library/react-native';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge status="danger">Flagged</Badge>);
    expect(screen.getByText('Flagged')).toBeTruthy();
  });

  it('defaults to the neutral status', () => {
    render(<Badge testId="badge">Draft</Badge>);
    expect(screen.getByTestId('badge')).toBeTruthy();
  });
});
