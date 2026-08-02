import { type IconName } from '@ecclesia/ui-core';
import type { IconSizeToken } from '@ecclesia/ui-core';
export interface IconProps {
    /** One of the curated names in `ICON_REGISTRY` (`@ecclesia/ui-core`) - never a raw lucide component name (Design System v1.0 Part 9). */
    name: IconName;
    size?: IconSizeToken;
    /** Defaults to the current theme's `text.secondary` - icons are rarely the loudest thing on screen (Part 5.8). */
    color?: string;
    /** Required when the icon conveys meaning with no adjacent text label (Part 1.5/Part 7.9 - "icon-only buttons always carry an accessibilityLabel"). Omit for purely decorative icons. */
    'aria-label'?: string;
}
/**
 * The single entry point to Ecclesia's icon set (Design System v1.0 Part
 * 9). No screen or component outside this file imports `lucide-react`
 * directly - see `@ecclesia/ui-core`'s `ICON_REGISTRY` for the full
 * rationale and the curated name list.
 */
export declare function Icon({ name, size, color, 'aria-label': ariaLabel }: IconProps): import("react").JSX.Element;
//# sourceMappingURL=Icon.d.ts.map