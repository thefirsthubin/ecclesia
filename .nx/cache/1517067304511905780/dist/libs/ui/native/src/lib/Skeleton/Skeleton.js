"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = Skeleton;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const ThemeProvider_2 = require("../ThemeProvider");
/**
 * Loading placeholder. Mirrors `ui-web`'s `Skeleton`: pulse animation is
 * disabled when the platform's reduce-motion accessibility setting is on,
 * leaving a static neutral block instead.
 */
function Skeleton({ width = '100%', height = 16, radius = 'sm', circle = false, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const reducedMotion = (0, ThemeProvider_2.useReducedMotion)();
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    (0, react_1.useEffect)(() => {
        if (reducedMotion) {
            opacity.setValue(1);
            return;
        }
        const loop = react_native_1.Animated.loop(react_native_1.Animated.sequence([
            react_native_1.Animated.timing(opacity, {
                toValue: 0.4,
                duration: theme.motion.duration.slow,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
            react_native_1.Animated.timing(opacity, {
                toValue: 1,
                duration: theme.motion.duration.slow,
                easing: react_native_1.Easing.inOut(react_native_1.Easing.ease),
                useNativeDriver: true,
            }),
        ]));
        loop.start();
        return () => loop.stop();
    }, [reducedMotion, opacity, theme.motion.duration.slow]);
    const borderRadius = circle
        ? (typeof height === 'number' ? height : 9999) / 2
        : radius === 'none'
            ? 0
            : radius === 'full'
                ? 9999
                : theme.radius[radius];
    return ((0, jsx_runtime_1.jsx)(react_native_1.Animated.View, { testID: testId, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", style: {
            width: circle ? height : width,
            height,
            borderRadius,
            backgroundColor: theme.colors.border.subtle,
            opacity,
        } }));
}
//# sourceMappingURL=Skeleton.js.map