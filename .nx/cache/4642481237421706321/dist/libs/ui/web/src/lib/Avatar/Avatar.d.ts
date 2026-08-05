import type { AvatarSizeToken } from '@ecclesia/ui-core';
export interface AvatarProps {
    /** The Person's full name - used for the accessible label and, when `src` is absent, the initials fallback. */
    name: string;
    src?: string;
    size?: AvatarSizeToken;
    testId?: string;
}
/**
 * Represents a Person compactly (Design System v1.0 Part 7.11 -
 * reinforcing "Relationships Matter", Part 1.2). Always renders an
 * accessible name, whether via `<img alt>` or the initials fallback's
 * `aria-label` - "an avatar is never the sole identifier" without a
 * text-accessible name attached to it.
 */
export declare function Avatar({ name, src, size, testId }: AvatarProps): import("react").JSX.Element;
//# sourceMappingURL=Avatar.d.ts.map