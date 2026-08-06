import {
  cloneElement,
  useId,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
} from 'react';
import { useTheme } from '../ThemeProvider';

export interface TooltipProps {
  /** Short supplementary text - Design System v1.0 Part 7.8's own scope for Tooltip: "brief, supplementary, never the only way to access information a sighted mouse user can hover to reveal but a keyboard/touch user cannot." */
  content: string;
  /** A single focusable element (a `Button`, an icon-only control, etc.) - cloned to add the hover/focus handlers and `aria-describedby`, never wrapped in an extra non-semantic element that would break the child's own event handlers or styling. */
  children: ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  testId?: string;
}

const PLACEMENT_STYLE: Record<NonNullable<TooltipProps['placement']>, { top?: string; bottom?: string; left?: string; right?: string; transform: string }> = {
  top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
  bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
  left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
  right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
};

/**
 * A brief, supplementary hover/focus label (Design System v1.0 Part 7.8) -
 * never the *only* place a piece of information lives (that rule is a
 * caller discipline concern, same as `Button`'s "one primary per screen"
 * or `Modal`'s "never stack a second modal" - not something this
 * component enforces structurally). Shown on `mouseenter`/`focus`, hidden
 * on `mouseleave`/`blur`/`Escape` - both a mouse *and* keyboard user can
 * trigger it, which is the accessibility bar a hover-only implementation
 * would fail.
 */
export function Tooltip({ content, children, placement = 'top', testId }: TooltipProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();
  const child = children as ReactElement<Record<string, unknown>>;
  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const trigger = cloneElement(child, {
    'aria-describedby': visible ? tooltipId : undefined,
    onMouseEnter: (event: ReactMouseEvent) => {
      show();
      (child.props.onMouseEnter as ((e: ReactMouseEvent) => void) | undefined)?.(event);
    },
    onMouseLeave: (event: ReactMouseEvent) => {
      hide();
      (child.props.onMouseLeave as ((e: ReactMouseEvent) => void) | undefined)?.(event);
    },
    onFocus: (event: ReactFocusEvent) => {
      show();
      (child.props.onFocus as ((e: ReactFocusEvent) => void) | undefined)?.(event);
    },
    onBlur: (event: ReactFocusEvent) => {
      hide();
      (child.props.onBlur as ((e: ReactFocusEvent) => void) | undefined)?.(event);
    },
    onKeyDown: (event: ReactKeyboardEvent) => {
      if (event.key === 'Escape') {
        hide();
      }
      (child.props.onKeyDown as ((e: ReactKeyboardEvent) => void) | undefined)?.(event);
    },
  });

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          data-testid={testId}
          style={{
            position: 'absolute',
            zIndex: theme.zIndex.overlay,
            whiteSpace: 'nowrap',
            padding: `${theme.spacing[1]}px ${theme.spacing[2]}px`,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.text.primary,
            color: theme.colors.surface.raised,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.caption.fontSize,
            pointerEvents: 'none',
            ...PLACEMENT_STYLE[placement],
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
