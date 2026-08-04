"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordPicker = RecordPicker;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Modal_1 = require("../Modal");
/**
 * React Native equivalent of `ui-web`'s `RecordPicker` - same
 * caller-supplied-`onSearch` contract and single-select scope (see that
 * file's doc comment). Reuses this library's own `Modal`
 * (`variant="dialog"`) for the search+results overlay, the same choice
 * `Select` made for its native option list - a full-screen dropdown
 * anchored under a trigger doesn't translate well to a phone-width
 * screen the way it does on web, so this is a modal search experience
 * instead, not a smaller port of the web dropdown.
 */
function RecordPicker({ label, placeholder = 'Search…', value, onChange, onSearch, debounceMs = 300, error, helperText, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const [query, setQuery] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [results, setResults] = (0, react_1.useState)([]);
    const [searched, setSearched] = (0, react_1.useState)(false);
    const debounceTimer = (0, react_1.useRef)(null);
    const requestId = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(() => {
        if (!open) {
            return;
        }
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }
        debounceTimer.current = setTimeout(() => {
            const thisRequest = ++requestId.current;
            setLoading(true);
            void onSearch(query)
                .then((found) => {
                if (requestId.current === thisRequest) {
                    setResults(found);
                    setSearched(true);
                }
            })
                .finally(() => {
                if (requestId.current === thisRequest) {
                    setLoading(false);
                }
            });
        }, debounceMs);
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [query, open, debounceMs, onSearch]);
    const select = (option) => {
        onChange(option);
        setOpen(false);
        setQuery('');
        setSearched(false);
        setResults([]);
    };
    const openPicker = () => {
        onChange(null);
        setOpen(true);
    };
    const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.label.fontSize, fontWeight: '600', color: theme.colors.text.secondary }, children: label }), value ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId ? `${testId}-selected` : undefined, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: theme.spacing[3],
                    paddingVertical: theme.spacing[2],
                    borderRadius: theme.radius.sm,
                    borderWidth: 1,
                    borderColor: theme.colors.border.default,
                    backgroundColor: theme.colors.surface.raised,
                }, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: value.label }), value.description && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }, children: value.description }))] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: openPicker, accessibilityRole: "button", accessibilityLabel: "Change", children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: '600', color: theme.colors.brand.default }, children: "Change" }) })] })) : ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { testID: testId, onPress: () => setOpen(true), accessibilityRole: "button", accessibilityLabel: label, style: {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    height: theme.touchTarget.minIOS,
                    paddingHorizontal: theme.spacing[3],
                    borderRadius: theme.radius.sm,
                    borderWidth: 1,
                    borderColor,
                    backgroundColor: theme.colors.surface.raised,
                }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "search", size: "sm" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.disabled }, children: placeholder })] })), (error || helperText) && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { accessibilityRole: error ? 'alert' : undefined, style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary }, children: error ?? helperText })), (0, jsx_runtime_1.jsx)(Modal_1.Modal, { isOpen: open, onClose: () => setOpen(false), title: label, variant: "dialog", testId: testId ? `${testId}-modal` : undefined, children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { gap: theme.spacing[3] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { value: query, onChangeText: setQuery, placeholder: placeholder, autoFocus: true, 
                            // Not `label` again - the underlying trigger `Pressable` (still
                            // mounted behind the open `Modal`, matching `Select`'s and
                            // `Drawer`'s own choice not to unmount siblings while an
                            // overlay is open) already carries that `accessibilityLabel`,
                            // and `Modal`'s own `title` heading announces `label` on open -
                            // a second identically-labelled element would be ambiguous to
                            // both assistive tech and test queries.
                            accessibilityLabel: "Search", placeholderTextColor: theme.colors.text.disabled, style: {
                                height: theme.touchTarget.minIOS,
                                paddingHorizontal: theme.spacing[3],
                                borderRadius: theme.radius.sm,
                                borderWidth: 1,
                                borderColor: theme.colors.border.default,
                                backgroundColor: theme.colors.surface.default,
                                color: theme.colors.text.primary,
                                fontFamily: theme.fontFamily.base,
                                fontSize: theme.typography.body.fontSize,
                            } }), loading ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { alignItems: 'center', paddingVertical: theme.spacing[4] }, children: (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: theme.colors.brand.default }) })) : results.length === 0 && searched ? ((0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.secondary }, children: ["No matches", query ? ` for "${query}"` : ''] })) : (results.map((option) => ((0, jsx_runtime_1.jsxs)(react_native_1.Pressable, { onPress: () => select(option), accessibilityRole: "menuitem", style: { paddingVertical: theme.spacing[2] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: option.label }), option.description && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }, children: option.description }))] }, option.id))))] }) })] }));
}
//# sourceMappingURL=RecordPicker.js.map