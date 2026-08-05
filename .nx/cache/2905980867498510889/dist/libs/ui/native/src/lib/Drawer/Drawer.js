"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = Drawer;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Heading_1 = require("../Heading");
/**
 * React Native equivalent of `ui-web`'s `Drawer`, built on RN's own
 * `Modal` primitive - the same choice `ui-native`'s `Modal` made (see that
 * file's doc comment for the full rationale). The panel is a full-height
 * `View` anchored to `side` instead of centered, `slideInLeft`/
 * `slideInRight` isn't a built-in RN `animationType`, so `slide`
 * (RN's own bottom-anchored slide) is intentionally *not* used here -
 * `fade` is used instead to avoid a visually-wrong bottom-slide for a
 * side panel; a true edge-slide transition would need
 * `react-native-reanimated` and is a disclosed follow-up, not this
 * component's scope.
 */
function Drawer({ isOpen, onClose, title, children, side = 'right', dismissible = true, footer, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsx)(react_native_1.Modal, { visible: isOpen, transparent: true, animationType: "fade", onRequestClose: dismissible ? onClose : () => undefined, testID: testId, children: (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { testID: testId ? `${testId}-scrim` : undefined, onPress: dismissible ? onClose : undefined, style: {
                flex: 1,
                flexDirection: 'row',
                justifyContent: side === 'right' ? 'flex-end' : 'flex-start',
                backgroundColor: theme.colors.surface.overlay,
            }, children: (0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { accessibilityViewIsModal: true, accessibilityRole: "none", testID: testId ? `${testId}-panel` : undefined, onPress: (event) => event.stopPropagation(), style: {
                    width: '85%',
                    maxWidth: 400,
                    height: '100%',
                    backgroundColor: theme.colors.surface.raised,
                    padding: theme.spacing[5],
                    gap: theme.spacing[4],
                }, children: [(0, jsx_runtime_1.jsx)(Heading_1.Heading, { level: 3, children: title }), (0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: { flex: 1 }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { children: children }) }), footer && (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flexDirection: 'row', justifyContent: 'flex-end', gap: theme.spacing[2] }, children: footer })] }) }) }));
}
//# sourceMappingURL=Drawer.js.map