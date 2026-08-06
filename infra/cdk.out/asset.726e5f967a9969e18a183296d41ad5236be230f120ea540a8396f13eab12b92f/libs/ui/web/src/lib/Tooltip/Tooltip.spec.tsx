import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('is not rendered until the trigger is hovered or focused', () => {
    render(
      <Tooltip content="Flagged for review">
        <button>Status</button>
      </Tooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on mouse enter and hides on mouse leave', () => {
    render(
      <Tooltip content="Flagged for review">
        <button>Status</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Status' });
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Flagged for review');
    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows on keyboard focus so a non-mouse user can reach it too', () => {
    render(
      <Tooltip content="Flagged for review">
        <button>Status</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Status' });
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-describedby');
  });

  it('hides on Escape', () => {
    render(
      <Tooltip content="Flagged for review">
        <button>Status</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Status' });
    fireEvent.focus(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
