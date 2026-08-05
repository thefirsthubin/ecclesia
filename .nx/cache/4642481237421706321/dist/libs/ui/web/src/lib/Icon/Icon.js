"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Icon = Icon;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const LucideIcons = tslib_1.__importStar(require("lucide-react"));
const ui_core_1 = require("@ecclesia/ui-core");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * The single entry point to Ecclesia's icon set (Design System v1.0 Part
 * 9). No screen or component outside this file imports `lucide-react`
 * directly - see `@ecclesia/ui-core`'s `ICON_REGISTRY` for the full
 * rationale and the curated name list.
 */
function Icon({ name, size = 'md', color, 'aria-label': ariaLabel }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const lucideKey = ui_core_1.ICON_REGISTRY[name];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lucide-react's own type exports don't offer a clean "look up by string key" signature; this is the one, intentionally-contained boundary where that's necessary.
    const LucideComponent = LucideIcons[lucideKey];
    if (!LucideComponent) {
        // Fails loudly in development rather than silently rendering nothing -
        // an icon name/lucide-key mismatch is a programming error in this
        // package, not a runtime data condition a consuming screen should
        // need to guard against.
        throw new Error(`Icon: no lucide export found for "${lucideKey}" (icon name "${name}")`);
    }
    return ((0, jsx_runtime_1.jsx)(LucideComponent, { size: theme.iconSize[size], color: color ?? theme.colors.text.secondary, "aria-hidden": ariaLabel ? undefined : true, role: ariaLabel ? 'img' : undefined, "aria-label": ariaLabel }));
}
//# sourceMappingURL=Icon.js.map