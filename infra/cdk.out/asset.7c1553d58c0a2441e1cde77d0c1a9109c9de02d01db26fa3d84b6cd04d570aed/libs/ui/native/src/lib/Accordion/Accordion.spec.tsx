import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Accordion } from './Accordion';

const ITEMS = [
  { id: 'a', title: 'Section A', content: <Text>Content A</Text> },
  { id: 'b', title: 'Section B', content: <Text>Content B</Text> },
];

describe('Accordion', () => {
  it('exposes accessibilityState.expanded reflecting the expandedIds prop', () => {
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Section A' }).props.accessibilityState.expanded).toBe(true);
    expect(screen.getByRole('button', { name: 'Section B' }).props.accessibilityState.expanded).toBe(false);
  });

  it('renders only the expanded panel content', () => {
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={() => undefined} />);
    expect(screen.getByText('Content A')).toBeTruthy();
    expect(screen.queryByText('Content B')).toBeNull();
  });

  it('collapses the open item when allowMultiple is false and another is pressed', () => {
    const onChange = jest.fn();
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={onChange} allowMultiple={false} />);
    fireEvent.press(screen.getByRole('button', { name: 'Section B' }));
    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('allows multiple open items when allowMultiple is true', () => {
    const onChange = jest.fn();
    render(<Accordion items={ITEMS} expandedIds={['a']} onChange={onChange} allowMultiple />);
    fireEvent.press(screen.getByRole('button', { name: 'Section B' }));
    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });
});
