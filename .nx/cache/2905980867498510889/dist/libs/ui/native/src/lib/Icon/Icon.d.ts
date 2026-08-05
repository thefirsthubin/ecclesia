import { type IconName, type IconSizeToken } from '@ecclesia/ui-core';
export interface IconProps {
    name: IconName;
    size?: IconSizeToken;
    color?: string;
    /** See `ui-web`'s `Icon` for the full accessibility rationale - identical rule here via RN's `accessibilityLabel`/`accessible` props instead of ARIA. */
    accessibilityLabel?: string;
}
/**
 * The React Native half of Ecclesia's single icon system (Design System
 * v1.0 Part 9) - same `ICON_REGISTRY` as `ui-web`'s `Icon`, rendering
 * through `lucide-react-native` instead of `lucide-react`. No screen
 * imports lucide directly on either platform.
 */
export declare function Icon({ name, size, color, accessibilityLabel }: IconProps): import("react").JSX.Element;
//# sourceMappingURL=Icon.d.ts.map