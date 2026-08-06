import { render, screen } from '@testing-library/react-native';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders', () => {
    render(<Divider testId="divider" />);
    // Divider is deliberately `accessibilityElementsHidden` (Design
    // System v1.0 Part 7 - it's decorative, not content) - RN Testing
    // Library's queries exclude accessibility-hidden elements by default,
    // the same way they'd be invisible to a screen reader, so this needs
    // `includeHiddenElements` to assert the element exists at all.
    expect(screen.getByTestId('divider', { includeHiddenElements: true })).toBeTruthy();
  });
});
