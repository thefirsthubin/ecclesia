"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Search = Search;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * React Native equivalent of `ui-web`'s `Search` - same leading-icon +
 * trailing-clear-button + debounced `onSearch` behavior, `accessibilityLabel`
 * instead of a rendered `<label>` (same "search fields are toolbar-inline,
 * not full form fields" reasoning as web).
 */
function Search({ label, value, onChange, onSearch, debounceMs = 300, testId, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const debounceTimer = (0, react_1.useRef)(null);
    const isFirstRun = (0, react_1.useRef)(true);
    (0, react_1.useEffect)(() => {
        if (!onSearch) {
            return;
        }
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        if (debounceMs === 0) {
            onSearch(value);
            return;
        }
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => onSearch(value), debounceMs);
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [value, debounceMs]);
    const clear = () => {
        onChange('');
        onSearch?.('');
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { position: 'relative', justifyContent: 'center' }, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: { position: 'absolute', left: theme.spacing[3], zIndex: 1 }, pointerEvents: "none", children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "search", size: "sm" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { ...rest, value: value, onChangeText: onChange, testID: testId, accessibilityLabel: label, placeholderTextColor: theme.colors.text.disabled, style: {
                    height: theme.touchTarget.minIOS,
                    paddingLeft: theme.spacing[8],
                    paddingRight: theme.spacing[8],
                    borderRadius: theme.radius.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.surface.raised,
                    color: theme.colors.text.primary,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.body.fontSize,
                } }), value.length > 0 && ((0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: clear, accessibilityRole: "button", accessibilityLabel: "Clear search", hitSlop: 8, style: { position: 'absolute', right: theme.spacing[3] }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm" }) }))] }));
}
//# sourceMappingURL=Search.js.map