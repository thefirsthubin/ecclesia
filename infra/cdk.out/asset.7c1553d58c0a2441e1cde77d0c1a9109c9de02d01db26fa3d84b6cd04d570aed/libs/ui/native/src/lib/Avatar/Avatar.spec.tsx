import { render, screen } from '@testing-library/react-native';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders initials from a two-word name', () => {
    render(<Avatar name="Kwabena Owusu" />);
    expect(screen.getByText('KO')).toBeTruthy();
  });

  it('exposes the full name as an accessible label', () => {
    render(<Avatar name="Kwabena Owusu" />);
    expect(screen.getByLabelText('Kwabena Owusu')).toBeTruthy();
  });

  it('renders a photo with an accessible label when src is given', () => {
    render(<Avatar name="Ama Serwaa" src="https://example.com/ama.jpg" />);
    expect(screen.getByLabelText('Ama Serwaa')).toBeTruthy();
  });
});
