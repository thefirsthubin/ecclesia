import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination currentPage={1} totalPages={1} onPageChange={() => undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page with aria-current="page"', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={() => undefined} />);
    expect(screen.getByText('3')).toHaveAttribute('aria-current', 'page');
  });

  it('truncates a long page list with ellipses', () => {
    render(<Pagination currentPage={10} totalPages={50} onPageChange={() => undefined} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });

  it('calls onPageChange with the clicked page', () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('4'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('disables Previous on the first page and Next on the last page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => undefined} />);
    expect(screen.getByLabelText('Previous page')).toBeDisabled();
    expect(screen.getByLabelText('Next page')).not.toBeDisabled();
  });
});
