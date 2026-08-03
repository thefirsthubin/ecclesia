import type { ReactNode } from 'react';
import type { StatusKey } from '@ecclesia/ui-core';
export interface BadgeProps {
    children: ReactNode;
    /** Design System v1.0 Part 5.10 - the five-color status system. Never repurposed for anything but status meaning (Part 5.10's "a status color is never reused for anything except status"). */
    status?: StatusKey;
    /** `subtle` (tinted background, Part 7.9 default) or `solid` (the status's strong fill, for higher emphasis). */
    variant?: 'subtle' | 'solid';
    testId?: string;
}
/**
 * A small inline status/count/label indicator (Design System v1.0 Part
 * 7.9). Note Part 7.9's own rule: a badge is never the *sole* means of
 * conveying urgency - callers are responsible for also reflecting urgency
 * in list position/ordering (Part 4.2's priority zone), this component
 * only renders the visual chip itself.
 */
export declare function Badge({ children, status, variant, testId }: BadgeProps): import("react").JSX.Element;
//# sourceMappingURL=Badge.d.ts.map