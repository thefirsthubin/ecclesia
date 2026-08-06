import { render, screen } from '@testing-library/react-native';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders and is hidden from the accessibility tree', () => {
    render(<Skeleton testId="skeleton" />);
    // Same reasoning as Divider.spec.tsx: `accessibilityElementsHidden`
    // makes RN Testing Library's default queries skip the element too,
    // so asserting it renders at all needs `includeHiddenElements`.
    const node = screen.getByTestId('skeleton', { includeHiddenElements: true });
    expect(node).toBeTruthy();
    expect(node.props.accessibilityElementsHidden).toBe(true);
  });
});
