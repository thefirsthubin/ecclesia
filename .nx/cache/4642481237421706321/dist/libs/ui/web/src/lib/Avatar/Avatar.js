"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A deliberately small, accessible palette for the initials fallback -
 * distinct from the five-color status system (Part 5.10) so an avatar
 * color is never mistaken for a status signal (Design System v1.0 Part
 * 5.9's illustration/iconography restraint applies here too).
 */
const INITIALS_PALETTE = ['#1B7A6E', '#4C9A6A', '#1554A0', '#8A5A00', '#6B4FA1', '#B3261E'];
function getInitials(name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0)
        return '?';
    if (parts.length === 1)
        return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
function getPaletteColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return INITIALS_PALETTE[hash % INITIALS_PALETTE.length];
}
/**
 * Represents a Person compactly (Design System v1.0 Part 7.11 -
 * reinforcing "Relationships Matter", Part 1.2). Always renders an
 * accessible name, whether via `<img alt>` or the initials fallback's
 * `aria-label` - "an avatar is never the sole identifier" without a
 * text-accessible name attached to it.
 */
function Avatar({ name, src, size = 'md', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const diameter = theme.avatarSize[size];
    const commonStyle = {
        width: diameter,
        height: diameter,
        borderRadius: theme.radius.full,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    };
    if (src) {
        return ((0, jsx_runtime_1.jsx)("img", { src: src, alt: name, "data-testid": testId, style: { ...commonStyle, objectFit: 'cover' } }));
    }
    return ((0, jsx_runtime_1.jsx)("span", { role: "img", "aria-label": name, "data-testid": testId, style: {
            ...commonStyle,
            backgroundColor: getPaletteColor(name),
            color: theme.colors.text.inverse,
            fontFamily: theme.fontFamily.base,
            fontSize: Math.round(diameter * 0.4),
            fontWeight: 600,
        }, children: getInitials(name) }));
}
//# sourceMappingURL=Avatar.js.map