"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterBar = FilterBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * React Native equivalent of `ui-web`'s `FilterBar` - same thin-display,
 * not-a-filter-builder scope (see that file's doc comment). Wraps chips
 * with `flexWrap` since a phone-width row fits far fewer chips than web.
 */
function FilterBar({ filters, onRemove, onClearAll, children, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    if (filters.length === 0 && !children) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId, style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing[2] }, children: [filters.map((filter) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[1],
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    borderRadius: theme.radius.full,
                    borderWidth: 1,
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.surface.raised,
                }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.primary }, children: filter.label }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => onRemove(filter.id), accessibilityRole: "button", accessibilityLabel: `Remove filter: ${filter.label}`, hitSlop: 8, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm" }) })] }, filter.id))), filters.length > 0 && onClearAll && ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: onClearAll, accessibilityRole: "button", accessibilityLabel: "Clear all filters", children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: '600', color: theme.colors.brand.default }, children: "Clear all" }) })), children] }));
}
//# sourceMappingURL=FilterBar.js.map