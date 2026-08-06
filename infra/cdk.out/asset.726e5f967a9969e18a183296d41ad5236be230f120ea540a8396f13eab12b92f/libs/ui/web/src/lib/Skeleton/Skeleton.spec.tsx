import { render } from '@testing-library/react';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders and is hidden from assistive technology (a loading state, not content)', () => {
    const { getByTestId } = render(<Skeleton testId="sk" />);
    expect(getByTestId('sk')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders as a circle when circle is true', () => {
    const { getByTestId } = render(<Skeleton testId="sk" circle />);
    expect(getByTestId('sk')).toHaveStyle({ borderRadius: '9999px' });
  });
});
