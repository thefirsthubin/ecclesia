import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => undefined} title="Add Person">
        Body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as a labelled dialog when open', () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Add Person">
        Body content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Add Person')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('calls onClose on Escape when dismissible (the default)', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Add Person">
        Body
      </Modal>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose on scrim click when dismissible', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Add Person" testId="add-person-modal">
        Body
      </Modal>,
    );
    fireEvent.click(screen.getByTestId('add-person-modal-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on Escape or scrim click when dismissible={false} (destructive dialog)', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Delete Person" dismissible={false} testId="delete-modal">
        This cannot be undone.
      </Modal>,
    );
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(screen.getByTestId('delete-modal-scrim'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not propagate a click inside the dialog surface to the scrim', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Add Person">
        Body
      </Modal>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders footer actions when given', () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Add Person" footer={<button>Save</button>}>
        Body
      </Modal>,
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
