import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('exposes an accessible status role with a default label', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('accepts a custom label', () => {
    render(<Spinner label="Syncing 3 records" />);
    expect(screen.getByRole('status', { name: 'Syncing 3 records' })).toBeInTheDocument();
  });
});
