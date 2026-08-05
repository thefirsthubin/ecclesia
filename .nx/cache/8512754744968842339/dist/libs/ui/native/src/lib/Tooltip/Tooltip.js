"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = Tooltip;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `Tooltip`. RN has no hover
 * concept (Design System v1.0 Part 7.8 names this as mobile's own
 * distinct case) - triggered by `onLongPress` instead, auto-hiding after
 * `autoHideDuration` since there is no `mouseleave` to hide it on. Also
 * sets `accessibilityHint` on the child unconditionally (not only while
 * the visual bubble is shown) - VoiceOver/TalkBack read a control's
 * `accessibilityHint` on focus regardless of the visual tooltip state, so
 * a screen-reader user gets the supplementary content without needing to
 * discover the long-press gesture at all.
 */
function Tooltip({ content, children, placement = 'top', autoHideDuration = 2500, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [visible, setVisible] = (0, react_1.useState)(false);
    const hideTimer = (0, react_1.useRef)(null);
    const child = children;
    (0, react_1.useEffect)(() => {
        return () => {
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
        };
    }, []);
    const trigger = (0, react_1.cloneElement)(child, {
        accessibilityHint: content,
        onLongPress: (event) => {
            setVisible(true);
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
            }
            hideTimer.current = setTimeout(() => setVisible(false), autoHideDuration);
            child.props.onLongPress?.(event);
        },
    });
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { position: 'relative', alignItems: placement === 'top' ? 'flex-start' : undefined }, children: [visible && ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", style: {
                    position: 'absolute',
                    [placement === 'top' ? 'bottom' : 'top']: '100%',
                    left: 0,
                    zIndex: theme.zIndex.overlay,
                    marginBottom: placement === 'top' ? theme.spacing[1] : 0,
                    marginTop: placement === 'bottom' ? theme.spacing[1] : 0,
                    paddingHorizontal: theme.spacing[2],
                    paddingVertical: theme.spacing[1],
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.text.primary,
                    maxWidth: 240,
                }, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.surface.raised }, children: content }) })), trigger] }));
}
//# sourceMappingURL=Tooltip.js.map