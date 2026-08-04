"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Radio = Radio;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A single option within a `RadioGroup` - React Native equivalent of
 * `ui-web`'s `Radio`. No native RN radio primitive exists, so this is a
 * `Pressable` ring + dot, with `accessibilityRole="radio"` carrying the
 * real semantics (same "artwork is decorative, props carry meaning" split
 * used throughout this library).
 */
function Radio({ label, checked, onPress, disabled = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const dotColor = checked ? theme.colors.brand.default : 'transparent';
    const ringColor = checked ? theme.colors.brand.default : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: disabled ? undefined : onPress, disabled: disabled, testID: testId, accessibilityRole: "radio", accessibilityLabel: label, accessibilityState: { checked, disabled }, hitSlop: 8, style: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[2],
            opacity: disabled ? theme.opacity.disabled : 1,
            minHeight: theme.touchTarget.minIOS,
        }, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: {
                    width: 20,
                    height: 20,
                    borderRadius: theme.radius.full,
                    borderWidth: 1.5,
                    borderColor: ringColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { width: 10, height: 10, borderRadius: theme.radius.full, backgroundColor: dotColor } }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: label })] }));
}
//# sourceMappingURL=Radio.js.map