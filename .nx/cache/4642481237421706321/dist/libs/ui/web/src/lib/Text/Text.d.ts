import type { ElementType, ReactNode } from 'react';
import type { TypographyRole } from '@ecclesia/ui-core';
export type TextVariant = Exclude<TypographyRole, 'display' | 'heading1' | 'heading2' | 'heading3'>;
export interface TextProps {
    children: ReactNode;
    /** Design System v1.0 Part 5.3/6.5 typography roles - excludes the heading/display roles, which are `<Heading>`'s job. */
    variant?: TextVariant;
    /** Defaults to `theme.colors.text.primary`. */
    color?: string;
    /** The rendered HTML tag - text content is a `<p>` by default (block), `<span>` for inline use. */
    as?: ElementType;
    testId?: string;
}
/**
 * The base text primitive every other component's copy renders through
 * (Design System v1.0 Part 7). Never hard-codes a font size/weight
 * outside the `typography` token table (Part 6.12 - "no component may
 * use a raw, non-token value").
 */
export declare function Text({ children, variant, color, as: Component, testId }: TextProps): import("react").JSX.Element;
//# sourceMappingURL=Text.d.ts.map