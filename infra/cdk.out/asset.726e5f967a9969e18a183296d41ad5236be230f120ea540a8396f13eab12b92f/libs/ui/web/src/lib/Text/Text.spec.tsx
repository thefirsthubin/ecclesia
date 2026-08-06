import { render, screen } from '@testing-library/react';
import { Text } from './Text';

describe('Text', () => {
  it('renders children as a paragraph by default', () => {
    render(<Text>Hello Ecclesia</Text>);
    const el = screen.getByText('Hello Ecclesia');
    expect(el.tagName).toBe('P');
  });

  it('renders as a span when as="span" is given', () => {
    render(<Text as="span">Inline</Text>);
    expect(screen.getByText('Inline').tagName).toBe('SPAN');
  });

  it('applies tabular numeric variant when variant="numericTabular"', () => {
    render(<Text variant="numericTabular">1,234</Text>);
    const el = screen.getByText('1,234');
    expect(el).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  it('forwards a testId as data-testid', () => {
    render(<Text testId="my-text">x</Text>);
    expect(screen.getByTestId('my-text')).toBeInTheDocument();
  });
});
