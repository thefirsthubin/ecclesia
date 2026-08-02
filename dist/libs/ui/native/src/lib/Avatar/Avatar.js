"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = Avatar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/** See `ui-web`'s `Avatar` for the initials/palette rationale - identical algorithm, RN primitives. */
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
function Avatar({ name, src, size = 'md', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const diameter = theme.avatarSize[size];
    if (src) {
        return ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: src }, accessible: true, accessibilityLabel: name, testID: testId, style: { width: diameter, height: diameter, borderRadius: theme.radius.full } }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { accessible: true, accessibilityLabel: name, testID: testId, style: {
            width: diameter,
            height: diameter,
            borderRadius: theme.radius.full,
            backgroundColor: getPaletteColor(name),
            alignItems: 'center',
            justifyContent: 'center',
        }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                fontFamily: theme.fontFamily.base,
                color: theme.colors.text.inverse,
                fontSize: Math.round(diameter * 0.4),
                fontWeight: '600',
            }, children: getInitials(name) }) }));
}
//# sourceMappingURL=Avatar.js.map