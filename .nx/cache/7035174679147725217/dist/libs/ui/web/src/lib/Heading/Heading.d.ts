import type { ReactNode } from 'react';
export interface HeadingProps {
    children: ReactNode;
    /** 1-3 maps to the Design System's heading1-3 roles; "display" is the Part 6.5 hero-metric role (Part 4.3's "used sparingly, at most once per screen"). */
    level: 1 | 2 | 3 | 'display';
    /**
     * The semantic HTML tag - defaults to `h${level}` (or `h1` for
     * "display"). Override only when visual size and document heading
     * hierarchy must diverge (e.g. a "display" hero metric that is not
     * actually the page's top heading) - accessibility (correct heading
     * order) always wins over visual size (Part 1.5).
     */
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    color?: string;
    testId?: string;
}
export declare function Heading({ children, level, as, color, testId }: HeadingProps): import("react").JSX.Element;
//# sourceMappingURL=Heading.d.ts.map