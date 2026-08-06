import { render, screen } from '@testing-library/react';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a known icon name without crashing', () => {
    render(<Icon name="check" aria-label="Complete" />);
    expect(screen.getByLabelText('Complete')).toBeInTheDocument();
  });

  it('is hidden from assistive technology when no aria-label is given (decorative use)', () => {
    const { container } = render(<Icon name="bell" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes an accessible role="img" when an aria-label is given', () => {
    render(<Icon name="alertTriangle" aria-label="Warning" />);
    expect(screen.getByRole('img', { name: 'Warning' })).toBeInTheDocument();
  });
});
