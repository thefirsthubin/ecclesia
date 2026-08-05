"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Search = Search;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
/**
 * A search field (Design System v1.0 Part 7.4) - `Input`'s pattern
 * reapplied with a leading search `Icon`, a trailing clear button once
 * there's a value, and built-in debouncing so every consuming screen
 * doesn't hand-roll its own `setTimeout` around `Input`. `type="search"`
 * gives the platform's own clear-on-Escape/IME behavior where the browser
 * provides it, on top of (not instead of) the explicit clear button
 * (not every browser renders a native clear affordance, and the explicit
 * button is keyboard/screen-reader reachable regardless of browser chrome).
 */
function Search({ label, value, onChange, onSearch, debounceMs = 300, testId, id, ...rest }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const generatedId = (0, react_1.useId)();
    const fieldId = id ?? generatedId;
    const [focused, setFocused] = (0, react_1.useState)(false);
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
        // Intentionally depends only on `value`/`debounceMs`, not `onSearch` -
        // this repo has no `eslint-plugin-react-hooks` installed (see
        // `ToastProvider.tsx`'s identical note), so there's no exhaustive-deps
        // rule to satisfy here either way.
    }, [value, debounceMs]);
    const clear = () => {
        onChange('');
        onSearch?.('');
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative', display: 'flex', alignItems: 'center' }, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: { position: 'absolute', left: theme.spacing[3], display: 'inline-flex', pointerEvents: 'none' }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "search", size: "sm" }) }), (0, jsx_runtime_1.jsx)("input", { ...rest, type: "search", id: fieldId, "aria-label": label, "data-testid": testId, value: value, onChange: (e) => onChange(e.target.value), onFocus: (e) => {
                    setFocused(true);
                    rest.onFocus?.(e);
                }, onBlur: (e) => {
                    setFocused(false);
                    rest.onBlur?.(e);
                }, style: {
                    width: '100%',
                    height: theme.touchTarget.minWeb,
                    padding: `0 ${theme.spacing[8]}px 0 ${theme.spacing[8]}px`,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${focused ? theme.colors.border.focus : theme.colors.border.default}`,
                    outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
                    outlineOffset: 1,
                    backgroundColor: theme.colors.surface.raised,
                    color: theme.colors.text.primary,
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.body.fontSize,
                } }), value.length > 0 && ((0, jsx_runtime_1.jsx)("button", { type: "button", "aria-label": "Clear search", onClick: clear, style: {
                    position: 'absolute',
                    right: theme.spacing[2],
                    display: 'inline-flex',
                    border: 'none',
                    background: 'none',
                    padding: theme.spacing[1],
                    cursor: 'pointer',
                    color: theme.colors.text.secondary,
                }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm" }) }))] }));
}
//# sourceMappingURL=Search.js.map