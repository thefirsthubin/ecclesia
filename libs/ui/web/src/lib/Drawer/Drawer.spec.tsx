import { render, screen, fireEvent } from '@testing-library/react';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(
      <Drawer isOpen={false} onClose={() => undefined} title="Filters">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as a labelled dialog when open', () => {
    render(
      <Drawer isOpen onClose={() => undefined} title="Filters">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('calls onClose on Escape when dismissible', () => {
    const onClose = jest.fn();
    render(
      <Drawer isOpen onClose={onClose} title="Filters" testId="drawer">
        <p>Content</p>
      </Drawer>,
    );
    fireEvent.keyDown(screen.getByTestId('drawer'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('defaults to a 400px panel width, overridable for content-heavier panels', () => {
    const { rerender } = render(
      <Drawer isOpen onClose={() => undefined} title="Filters" testId="drawer">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByTestId('drawer')).toHaveStyle({ width: '400px' });

    rerender(
      <Drawer isOpen onClose={() => undefined} title="Filters" testId="drawer" width={560}>
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByTestId('drawer')).toHaveStyle({ width: '560px' });
  });

  it('does not call onClose on scrim click when dismissible is false', () => {
    const onClose = jest.fn();
    render(
      <Drawer isOpen onClose={onClose} title="Filters" dismissible={false} testId="drawer">
        <p>Content</p>
      </Drawer>,
    );
    fireEvent.click(screen.getByTestId('drawer-scrim'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
