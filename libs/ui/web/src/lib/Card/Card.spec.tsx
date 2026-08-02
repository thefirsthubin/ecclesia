import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Bacenta 12</Card>);
    expect(screen.getByText('Bacenta 12')).toBeInTheDocument();
  });

  it('is not a button role by default', () => {
    render(<Card>Static content</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders with a button role and responds to click when interactive', () => {
    const onClick = jest.fn();
    render(
      <Card interactive onClick={onClick}>
        Open Bacenta 12
      </Card>,
    );
    const card = screen.getByRole('button', { name: 'Open Bacenta 12' });
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates via Enter and Space keys when interactive (Design System §7.2)', () => {
    const onClick = jest.fn();
    render(
      <Card interactive onClick={onClick}>
        Keyboard activatable
      </Card>,
    );
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
