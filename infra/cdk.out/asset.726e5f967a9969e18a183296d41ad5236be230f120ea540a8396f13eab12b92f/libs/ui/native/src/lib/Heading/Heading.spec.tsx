import { render, screen } from '@testing-library/react-native';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders children with the header accessibility role', () => {
    render(<Heading level={1}>Title</Heading>);
    const el = screen.getByText('Title');
    expect(el.props.accessibilityRole).toBe('header');
  });

  it('renders a "display" level heading', () => {
    render(<Heading level="display">72</Heading>);
    expect(screen.getByText('72')).toBeTruthy();
  });
});
