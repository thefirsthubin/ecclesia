"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = Tabs;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `Tabs`. RN ships real `"tab"`/
 * `"tablist"` `accessibilityRole` values (unlike, say, dialog-trapping,
 * this is one of the few cases RN's accessibility API maps directly onto
 * the ARIA concept), so this uses them rather than inventing a
 * `View`-plus-generic-role fallback. Tab bar is a horizontal
 * `ScrollView` (not a fixed-width row) since a Bacenta/Ministry-heavy tab
 * set can exceed one screen width on a phone in a way it wouldn't on
 * web. Only the active tab's content renders below - same
 * single-source-of-truth choice as `ui-web`'s version.
 */
function Tabs({ tabs, activeTabId, onChange, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId, children: [(0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, accessibilityRole: "tablist", children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flexDirection: 'row', gap: theme.spacing[1], borderBottomWidth: 1, borderBottomColor: theme.colors.border.subtle }, children: tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        return ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => !tab.disabled && onChange(tab.id), disabled: tab.disabled, accessibilityRole: "tab", accessibilityLabel: tab.label, accessibilityState: { selected: isActive, disabled: tab.disabled }, style: {
                                paddingHorizontal: theme.spacing[3],
                                paddingVertical: theme.spacing[2],
                                borderBottomWidth: 2,
                                borderBottomColor: isActive ? theme.colors.brand.default : 'transparent',
                                opacity: tab.disabled ? theme.opacity.disabled : 1,
                                minHeight: theme.touchTarget.minIOS,
                                justifyContent: 'center',
                            }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                                    fontFamily: theme.fontFamily.base,
                                    fontSize: theme.typography.body.fontSize,
                                    fontWeight: isActive ? '600' : '400',
                                    color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                                }, children: tab.label }) }, tab.id));
                    }) }) }), activeTab && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { paddingTop: theme.spacing[4] }, children: activeTab.content })] }));
}
//# sourceMappingURL=Tabs.js.map