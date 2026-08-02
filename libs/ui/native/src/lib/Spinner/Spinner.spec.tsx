import { render, screen } from '@testing-library/react-native';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('exposes an accessible label', () => {
    render(<Spinner />);
    expect(screen.getByLabelText('Loading')).toBeTruthy();
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Syncing 3 records" />);
    expect(screen.getByLabelText('Syncing 3 records')).toBeTruthy();
  });
});
