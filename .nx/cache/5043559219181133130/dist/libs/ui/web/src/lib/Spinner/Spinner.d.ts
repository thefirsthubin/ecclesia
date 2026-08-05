import type { Size } from '@ecclesia/ui-core';
export interface SpinnerProps {
    size?: Size;
    color?: string;
    /** Accessible label - defaults to "Loading" (Design System v1.0 Part 7.19). */
    label?: string;
}
/**
 * A determinate-duration rotation is deliberately NOT gated behind
 * `useReducedMotion` here: WCAG 2.1's reduced-motion guidance (2.3.3)
 * targets non-essential motion, and a loading spinner's rotation is the
 * one piece of information it exists to convey ("this is still working"),
 * not decoration - removing it would remove functionality, not just
 * flourish. Every other animated component in this package (Skeleton,
 * transitions) does respect `useReducedMotion`.
 */
export declare function Spinner({ size, color, label }: SpinnerProps): import("react").JSX.Element;
//# sourceMappingURL=Spinner.d.ts.map