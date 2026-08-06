import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('sets accessibilityHint on the child even before any interaction', () => {
    render(
      <Tooltip content="Flagged for review">
        <Pressable accessibilityLabel="Status">
          <Text>Status</Text>
        </Pressable>
      </Tooltip>,
    );
    expect(screen.getByLabelText('Status').props.accessibilityHint).toBe('Flagged for review');
  });

  it('shows the bubble on long press', () => {
    render(
      <Tooltip content="Flagged for review">
        <Pressable accessibilityLabel="Status">
          <Text>Status</Text>
        </Pressable>
      </Tooltip>,
    );
    expect(screen.queryByText('Flagged for review')).toBeNull();
    fireEvent(screen.getByLabelText('Status'), 'longPress');
    // `includeHiddenElements: true` - the bubble is intentionally
    // `accessibilityElementsHidden` (see `Tooltip.tsx`'s doc comment: the
    // trigger's own `accessibilityHint` already carries this content to
    // screen readers, so the visual bubble is deliberately hidden from
    // the accessibility tree to avoid a double announcement). It's still
    // really on screen for sighted users, so the query needs to opt back
    // in to see it - RTL's queries exclude accessibility-hidden nodes by
    // default.
    expect(screen.getByText('Flagged for review', { includeHiddenElements: true })).toBeTruthy();
  });

  it('auto-hides the bubble after the configured duration', async () => {
    // Real, short duration rather than `jest.useFakeTimers()` - see
    // `ToastProvider.spec.tsx`'s identical note on why fake timers were
    // observed to crash an unrelated `Skeleton` elsewhere in this suite.
    render(
      <Tooltip content="Flagged for review" autoHideDuration={30}>
        <Pressable accessibilityLabel="Status">
          <Text>Status</Text>
        </Pressable>
      </Tooltip>,
    );
    fireEvent(screen.getByLabelText('Status'), 'longPress');
    expect(screen.getByText('Flagged for review', { includeHiddenElements: true })).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Flagged for review', { includeHiddenElements: true })).toBeNull());
  });
});
