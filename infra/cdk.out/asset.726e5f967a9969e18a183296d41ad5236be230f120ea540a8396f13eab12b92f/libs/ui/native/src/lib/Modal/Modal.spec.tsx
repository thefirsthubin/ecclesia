import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => undefined} title="Add Person">
        <Text>Body</Text>
      </Modal>,
    );
    expect(screen.queryByText('Body')).toBeNull();
  });

  it('renders the title and children when open', () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Add Person">
        <Text>Body content</Text>
      </Modal>,
    );
    expect(screen.getByText('Add Person')).toBeTruthy();
    expect(screen.getByText('Body content')).toBeTruthy();
  });

  it('calls onClose on scrim press when dismissible (the default)', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Add Person" testId="add-person-modal">
        <Text>Body</Text>
      </Modal>,
    );
    fireEvent.press(screen.getByTestId('add-person-modal-scrim'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose on scrim press when dismissible={false} (destructive dialog)', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Delete Person" dismissible={false} testId="delete-modal">
        <Text>This cannot be undone.</Text>
      </Modal>,
    );
    fireEvent.press(screen.getByTestId('delete-modal-scrim'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders footer actions when given', () => {
    render(
      <Modal isOpen onClose={() => undefined} title="Add Person" footer={<Text>Save</Text>}>
        <Text>Body</Text>
      </Modal>,
    );
    expect(screen.getByText('Save')).toBeTruthy();
  });
});
