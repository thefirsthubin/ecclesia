export type { StatusKey, ChurchPulseBandKey, NeutralStep, SpacingStep, RadiusToken, ElevationLevel, BreakpointToken, MotionDuration, MotionEasing, ZIndexToken, OpacityToken, IconSizeToken, AvatarSizeToken, TypographyRole, } from '@ecclesia/ui-tokens';
/** Shared size scale used by most interactive/display components (Design System v1.0 Part 7). */
export type Size = 'sm' | 'md' | 'lg';
/** Button/interactive-element visual variants (Part 7.1). */
export type ActionVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
/**
 * A platform-neutral way for a shared prop-types file to describe "this
 * component needs a test hook." Web components spread this into
 * `data-testid`; native components spread it into `testID`. Consuming
 * code writes one prop (`testId`) regardless of platform.
 */
export interface Testable {
    testId?: string;
}
/** Every interactive foundation component accepts this - see Design System v1.0 Part 1.5/10. */
export interface AccessibleProps {
    /** A human-readable label for assistive technology when the visible content alone is insufficient (e.g. an icon-only button, Part 7.1). */
    accessibilityLabel?: string;
}
//# sourceMappingURL=types.d.ts.map