import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials from a two-word name', () => {
    render(<Avatar name="Kwabena Owusu" />);
    expect(screen.getByText('KO')).toBeInTheDocument();
  });

  it('exposes the full name as an accessible label for the initials fallback', () => {
    render(<Avatar name="Kwabena Owusu" />);
    expect(screen.getByRole('img', { name: 'Kwabena Owusu' })).toBeInTheDocument();
  });

  it('renders a photo with an accessible alt text when src is given', () => {
    render(<Avatar name="Ama Serwaa" src="https://example.com/ama.jpg" />);
    const img = screen.getByAltText('Ama Serwaa');
    expect(img.tagName).toBe('IMG');
  });

  it('falls back to "?" for an empty name rather than crashing', () => {
    render(<Avatar name="" />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('is deterministic - the same name always resolves to the same palette color', () => {
    const { container: c1 } = render(<Avatar name="Efua Mensah" />);
    const { container: c2 } = render(<Avatar name="Efua Mensah" />);
    expect(c1.querySelector('span')?.style.backgroundColor).toBe(c2.querySelector('span')?.style.backgroundColor);
  });
});
