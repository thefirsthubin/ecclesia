"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottomNav = BottomNav;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * Persistent bottom tab bar - mobile's primary navigation surface
 * (Design System v1.0 §3.1's mobile-nav pattern, the direct counterpart
 * to `ui-web`'s `Sidebar`). **Native only** - `Sidebar` already covers
 * web's persistent-left-nav pattern, and there is no equivalent
 * bottom-tab convention on web admin. Deliberately an `onPress(key)`
 * callback, not `Sidebar`'s `linkAs` router-injection pattern - mobile
 * navigation in this codebase goes through whatever navigation library
 * `apps/mobile` uses (not a hand-built web-style `Link`), so this stays
 * agnostic the same way `Tabs`' `onChange` does, rather than assuming a
 * specific navigation library's API shape.
 *
 * Does **not** apply its own safe-area bottom inset - this library has no
 * dependency on `react-native-safe-area-context` (not installed in this
 * workspace), so wrapping this in the caller's own safe-area container is
 * the caller's responsibility, the same disclosed boundary `Toast`'s
 * native provider draws around "mount near the app root."
 */
function BottomNav({ items, onPress, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, accessibilityRole: "tablist", style: {
            flexDirection: 'row',
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.subtle,
            backgroundColor: theme.colors.surface.raised,
            paddingVertical: theme.spacing[1],
        }, children: items.map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: () => onPress(item.key), accessibilityRole: "tab", accessibilityLabel: item.label, accessibilityState: { selected: item.active }, style: {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.spacing[1],
                minHeight: theme.touchTarget.minIOS,
                paddingVertical: theme.spacing[1],
            }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: item.icon, size: "sm", color: item.active ? theme.colors.brand.default : theme.colors.text.secondary }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: {
                        fontFamily: theme.fontFamily.base,
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: item.active ? '600' : '400',
                        color: item.active ? theme.colors.brand.default : theme.colors.text.secondary,
                    }, children: item.label })] }, item.key))) }));
}
//# sourceMappingURL=BottomNav.js.map