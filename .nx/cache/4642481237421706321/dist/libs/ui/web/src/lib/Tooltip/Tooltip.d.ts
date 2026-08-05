import { type ReactElement } from 'react';
export interface TooltipProps {
    /** Short supplementary text - Design System v1.0 Part 7.8's own scope for Tooltip: "brief, supplementary, never the only way to access information a sighted mouse user can hover to reveal but a keyboard/touch user cannot." */
    content: string;
    /** A single focusable element (a `Button`, an icon-only control, etc.) - cloned to add the hover/focus handlers and `aria-describedby`, never wrapped in an extra non-semantic element that would break the child's own event handlers or styling. */
    children: ReactElement;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    testId?: string;
}
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
export declare function Tooltip({ content, children, placement, testId }: TooltipProps): import("react").JSX.Element;
//# sourceMappingURL=Tooltip.d.ts.map