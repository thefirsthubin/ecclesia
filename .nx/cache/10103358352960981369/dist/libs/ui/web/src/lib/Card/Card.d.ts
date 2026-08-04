import { type ReactNode } from 'react';
import type { ElevationLevel, SpacingStep } from '@ecclesia/ui-core';
export interface CardProps {
    children: ReactNode;
    padding?: SpacingStep;
    elevation?: ElevationLevel;
    /** Design System v1.0 Part 7.2: makes the entire card surface a single tap target, e.g. a dashboard priority-zone item. */
    interactive?: boolean;
    onClick?: () => void;
    testId?: string;
}
/**
 * Groups related content (Design System v1.0 Part 7.2). `interactive`
 * cards are rendered as a real `<button>`-semantics element (`role`,
 * `tabIndex`, Enter/Space activation) rather than a `<div>` with a click
 * handler, so assistive technology announces them correctly (Part 7.2's
 * own accessibility note).
 */
export declare function Card({ children, padding, elevation, interactive, onClick, testId }: CardProps): import("react").JSX.Element;
//# sourceMappingURL=Card.d.ts.map