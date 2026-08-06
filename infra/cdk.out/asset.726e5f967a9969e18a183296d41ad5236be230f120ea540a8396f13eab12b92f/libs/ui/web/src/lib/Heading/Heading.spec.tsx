import { render, screen } from '@testing-library/react';
import { Heading } from './Heading';

describe('Heading', () => {
  it('renders level 1 as an <h1> by default', () => {
    render(<Heading level={1}>Title</Heading>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title');
  });

  it('renders level 3 as an <h3> by default', () => {
    render(<Heading level={3}>Subtitle</Heading>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subtitle');
  });

  it('renders "display" as an <h1> by default', () => {
    render(<Heading level="display">72</Heading>);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('72');
  });

  it('allows overriding the semantic tag independently of visual size', () => {
    render(
      <Heading level="display" as="h2">
        Church Pulse
      </Heading>,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
