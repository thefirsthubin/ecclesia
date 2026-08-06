import { cloneElement, useEffect, useRef, useState, type ReactElement } from 'react';
import { View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface TooltipProps {
  content: string;
  /** A single pressable element - cloned to add `onLongPress` and `accessibilityHint` (see this file's own doc comment for why the latter matters even when the visual bubble isn't shown). */
  children: ReactElement;
  placement?: 'top' | 'bottom';
  /** Milliseconds the bubble stays visible after a long-press. Defaults to 2500. */
  autoHideDuration?: number;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Tooltip`. RN has no hover
 * concept (Design System v1.0 Part 7.8 names this as mobile's own
 * distinct case) - triggered by `onLongPress` instead, auto-hiding after
 * `autoHideDuration` since there is no `mouseleave` to hide it on. Also
 * sets `accessibilityHint` on the child unconditionally (not only while
 * the visual bubble is shown) - VoiceOver/TalkBack read a control's
 * `accessibilityHint` on focus regardless of the visual tooltip state, so
 * a screen-reader user gets the supplementary content without needing to
 * discover the long-press gesture at all.
 */
export function Tooltip({ content, children, placement = 'top', autoHideDuration = 2500, testId }: TooltipProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const child = children as ReactElement<Record<string, unknown>>;

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const trigger = cloneElement(child, {
    accessibilityHint: content,
    onLongPress: (event: unknown) => {
      setVisible(true);
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      hideTimer.current = setTimeout(() => setVisible(false), autoHideDuration);
      (child.props.onLongPress as ((e: unknown) => void) | undefined)?.(event);
    },
  });

  return (
    <View style={{ position: 'relative', alignItems: placement === 'top' ? 'flex-start' : undefined }}>
      {visible && (
        <View
          testID={testId}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            [placement === 'top' ? 'bottom' : 'top']: '100%',
            left: 0,
            zIndex: theme.zIndex.overlay,
            marginBottom: placement === 'top' ? theme.spacing[1] : 0,
            marginTop: placement === 'bottom' ? theme.spacing[1] : 0,
            paddingHorizontal: theme.spacing[2],
            paddingVertical: theme.spacing[1],
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.text.primary,
            maxWidth: 240,
          }}
        >
          <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.surface.raised }}>
            {content}
          </RNText>
        </View>
      )}
      {trigger}
    </View>
  );
}
