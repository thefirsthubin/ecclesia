export interface HeadingProps {
    children: string;
    level: 1 | 2 | 3 | 'display';
    color?: string;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Heading`. React Native has no
 * native `<h1>`-`<h6>` semantic hierarchy - the closest accessibility
 * equivalent is `accessibilityRole="header"` on every heading regardless
 * of level (RN/iOS/Android screen readers do not expose a numeric heading
 * level the way HTML does), so document-order is what conveys hierarchy
 * on this platform, not a level-specific role.
 */
export declare function Heading({ children, level, color, testId }: HeadingProps): import("react").JSX.Element;
//# sourceMappingURL=Heading.d.ts.map