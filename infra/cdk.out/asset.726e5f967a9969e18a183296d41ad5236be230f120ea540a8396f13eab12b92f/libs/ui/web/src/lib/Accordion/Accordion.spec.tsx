import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from './Accordion';

const ITEMS = [
  { id: 'a', title: 'Section A', content: <p>Content A</p> },
  { id: 'b', title: 'Section B', content: <p>Content B</p> },
];

describe('Accordion', () => {
  it('renders headers as real buttons with aria-expanded reflecting state', () => {
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: /Section A/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Section B/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Content A')).toBeInTheDocument();
    expect(screen.queryByText('Content B')).not.toBeInTheDocument();
  });

  it('collapses the open item and does not open others when allowMultiple is false', () => {
    const onChange = jest.fn();
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={onChange} allowMultiple={false} />);
    fireEvent.click(screen.getByRole('button', { name: /Section B/ }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('allows multiple open items when allowMultiple is true', () => {
    const onChange = jest.fn();
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={onChange} allowMultiple />);
    fireEvent.click(screen.getByRole('button', { name: /Section B/ }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('renders the expanded panel as a labelled region', () => {
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={() => undefined} />);
    expect(screen.getByRole('region', { name: /Section A/ })).toHaveTextContent('Content A');
  });
});
