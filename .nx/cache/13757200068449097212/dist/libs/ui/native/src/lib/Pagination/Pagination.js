"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = Pagination;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * React Native equivalent of `ui-web`'s `Pagination` - deliberately
 * simpler, not a straight port: a row of small numbered buttons is a poor
 * touch target on a phone screen, so this is Previous/Next plus a
 * "Page X of Y" label instead, the same "don't port a desktop-scale
 * interaction 1:1" judgment call `Tabs`' horizontal-`ScrollView` bar made.
 */
function Pagination({ currentPage, totalPages, onPageChange, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    if (totalPages <= 1) {
        return null;
    }
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId, accessibilityRole: "none", style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing[4] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => onPageChange(currentPage - 1), disabled: currentPage === 1, accessibilityRole: "button", accessibilityLabel: "Previous page", accessibilityState: { disabled: currentPage === 1 }, hitSlop: 8, style: { opacity: currentPage === 1 ? theme.opacity.disabled : 1, minHeight: theme.touchTarget.minIOS, justifyContent: 'center' }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronLeft", size: "sm" }) }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { accessibilityLabel: `Page ${currentPage} of ${totalPages}`, style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: ["Page ", currentPage, " of ", totalPages] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, accessibilityRole: "button", accessibilityLabel: "Next page", accessibilityState: { disabled: currentPage === totalPages }, hitSlop: 8, style: { opacity: currentPage === totalPages ? theme.opacity.disabled : 1, minHeight: theme.touchTarget.minIOS, justifyContent: 'center' }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronRight", size: "sm" }) })] }));
}
//# sourceMappingURL=Pagination.js.map