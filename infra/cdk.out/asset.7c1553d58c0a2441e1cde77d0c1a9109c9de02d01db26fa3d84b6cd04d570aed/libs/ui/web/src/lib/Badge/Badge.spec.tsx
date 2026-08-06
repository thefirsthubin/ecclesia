import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge status="danger">Flagged</Badge>);
    expect(screen.getByText('Flagged')).toBeInTheDocument();
  });

  it('defaults to the neutral status', () => {
    render(<Badge testId="badge">Draft</Badge>);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('renders solid variant with inverse text color', () => {
    render(
      <Badge status="success" variant="solid" testId="badge">
        Verified
      </Badge>,
    );
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveStyle({ color: '#FFFFFF' });
  });
});
