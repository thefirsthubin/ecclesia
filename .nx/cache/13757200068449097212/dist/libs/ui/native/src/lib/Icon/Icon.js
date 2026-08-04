"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = Icon;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const LucideIcons = tslib_1.__importStar(require("lucide-react-native"));
const ui_core_1 = require("@ecclesia/ui-core");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * The React Native half of Ecclesia's single icon system (Design System
 * v1.0 Part 9) - same `ICON_REGISTRY` as `ui-web`'s `Icon`, rendering
 * through `lucide-react-native` instead of `lucide-react`. No screen
 * imports lucide directly on either platform.
 */
function Icon({ name, size = 'md', color, accessibilityLabel }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const lucideKey = ui_core_1.ICON_REGISTRY[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see ui-web's Icon.tsx for why this boundary is intentional and contained.
    const LucideComponent = LucideIcons[lucideKey];
    if (!LucideComponent) {
        throw new Error(`Icon: no lucide-react-native export found for "${lucideKey}" (icon name "${name}")`);
    }
    return ((0, jsx_runtime_1.jsx)(LucideComponent, { size: theme.iconSize[size], color: color ?? theme.colors.text.secondary, accessible: Boolean(accessibilityLabel), accessibilityLabel: accessibilityLabel, accessibilityElementsHidden: !accessibilityLabel, importantForAccessibility: accessibilityLabel ? 'yes' : 'no-hide-descendants' }));
}
//# sourceMappingURL=Icon.js.map