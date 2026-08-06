import { render, screen, fireEvent } from '@testing-library/react-native';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { toJSON } = render(<Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />);
    expect(toJSON()).toBeNull();
  });

  it('shows "Page X of Y"', () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => undefined} />);
    expect(screen.getByText('Page 2 of 5')).toBeTruthy();
  });

  it('calls onPageChange when Next is pressed', () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.press(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Previous page' }).props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Next page' }).props.accessibilityState.disabled).toBe(false);
  });
});
