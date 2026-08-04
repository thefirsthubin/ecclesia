import { type ReactElement } from 'react';
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
export declare function Tooltip({ content, children, placement, autoHideDuration, testId }: TooltipProps): import("react").JSX.Element;
//# sourceMappingURL=Tooltip.d.ts.map