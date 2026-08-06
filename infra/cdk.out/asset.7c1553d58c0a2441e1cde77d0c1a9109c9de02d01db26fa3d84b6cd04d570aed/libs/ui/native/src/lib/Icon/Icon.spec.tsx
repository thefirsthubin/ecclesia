import { render, screen } from '@testing-library/react-native';
import { Icon } from './Icon';

describe('Icon', () => {
  it('renders a known icon name without crashing', () => {
    render(<Icon name="check" accessibilityLabel="Complete" />);
    // lucide-react-native's SVG output nests the accessibility label onto
    // more than one element in the tree (the wrapping Svg and an inner
    // element both carry it) - asserting at least one match is what
    // "renders without crashing and is labeled" actually means here,
    // matching `getByLabelText`'s single-match assumption would be
    // asserting an implementation detail of the icon library, not
    // something this component's contract promises.
    expect(screen.getAllByLabelText('Complete').length).toBeGreaterThan(0);
  });

  it('is hidden from assistive technology when no accessibilityLabel is given (decorative use)', () => {
    render(<Icon name="bell" />);
    expect(screen.queryByLabelText('bell')).toBeNull();
  });
});
