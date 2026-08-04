"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordPicker = RecordPicker;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Spinner_1 = require("../Spinner");
/**
 * An async-searchable single-record picker (e.g. "assign a Bacenta
 * Leader", "add a member to this Group") - Design System v1.0 Part 7
 * Data tier. Single-select only for this foundation slice (disclosed,
 * not an oversight - the same "one full vertical slice, not every case"
 * phasing this project has used throughout); a multi-select variant is a
 * reasonable follow-up once a real screen needs it.
 *
 * Once a value is selected it renders as a compact chip with a "Change"
 * action (not the search input) - re-searching replaces the whole
 * selection, there is no separate "add another" affordance since this is
 * single-select.
 */
function RecordPicker({ label, placeholder = 'Search…', value, onChange, onSearch, debounceMs = 300, error, helperText, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const fieldId = (0, react_1.useId)();
    const helperId = `${fieldId}-helper`;
    const [query, setQuery] = (0, react_1.useState)('');
    const [open, setOpen] = (0, react_1.useState)(false);
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
    const startChange = () => {
        onChange(null);
        setOpen(true);
    };
    const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;
    return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: fieldId, style: {
                    fontFamily: theme.fontFamily.base,
                    fontSize: theme.typography.label.fontSize,
                    fontWeight: theme.typography.label.fontWeight,
                    letterSpacing: theme.typography.label.letterSpacing,
                    color: theme.colors.text.secondary,
                }, children: label }), value && !open ? ((0, jsx_runtime_1.jsxs)("div", { "data-testid": testId ? `${testId}-selected` : undefined, style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: theme.spacing[2],
                    padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                    borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border.default}`,
                    backgroundColor: theme.colors.surface.raised,
                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column' }, children: [(0, jsx_runtime_1.jsx)("span", { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }, children: value.label }), value.description && ((0, jsx_runtime_1.jsx)("span", { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }, children: value.description }))] }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: startChange, style: { border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.brand.default, fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: 600 }, children: "Change" })] })) : ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, children: [(0, jsx_runtime_1.jsx)("span", { "aria-hidden": true, style: { position: 'absolute', left: theme.spacing[3], top: theme.spacing[3], pointerEvents: 'none' }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "search", size: "sm" }) }), (0, jsx_runtime_1.jsx)("input", { id: fieldId, "data-testid": testId, role: "combobox", "aria-expanded": open, "aria-autocomplete": "list", "aria-invalid": Boolean(error) || undefined, "aria-describedby": error || helperText ? helperId : undefined, value: query, placeholder: placeholder, onFocus: () => setOpen(true), onChange: (e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }, style: {
                            width: '100%',
                            height: theme.touchTarget.minWeb,
                            padding: `0 ${theme.spacing[3]}px 0 ${theme.spacing[8]}px`,
                            borderRadius: theme.radius.sm,
                            border: `1px solid ${borderColor}`,
                            backgroundColor: theme.colors.surface.raised,
                            color: theme.colors.text.primary,
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.body.fontSize,
                        } }), open && ((0, jsx_runtime_1.jsx)("div", { role: "listbox", "aria-label": label, style: {
                            position: 'absolute',
                            zIndex: theme.zIndex.dropdown,
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: theme.spacing[1],
                            maxHeight: 240,
                            overflowY: 'auto',
                            borderRadius: theme.radius.sm,
                            border: `1px solid ${theme.colors.border.default}`,
                            backgroundColor: theme.colors.surface.raised,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                        }, children: loading ? ((0, jsx_runtime_1.jsx)("div", { style: { display: 'flex', justifyContent: 'center', padding: theme.spacing[4] }, children: (0, jsx_runtime_1.jsx)(Spinner_1.Spinner, { size: "sm" }) })) : results.length === 0 && searched ? ((0, jsx_runtime_1.jsxs)("div", { style: { padding: theme.spacing[3], fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.secondary }, children: ["No matches", query ? ` for "${query}"` : ''] })) : (results.map((option) => ((0, jsx_runtime_1.jsxs)("div", { role: "option", "aria-selected": false, onClick: () => select(option), style: {
                                padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                                cursor: 'pointer',
                                fontFamily: theme.fontFamily.base,
                                fontSize: theme.typography.body.fontSize,
                                color: theme.colors.text.primary,
                            }, children: [option.label, option.description && ((0, jsx_runtime_1.jsx)("div", { style: { fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }, children: option.description }))] }, option.id)))) }))] })), (error || helperText) && ((0, jsx_runtime_1.jsx)("span", { id: helperId, role: error ? 'alert' : undefined, style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary }, children: error ?? helperText }))] }));
}
//# sourceMappingURL=RecordPicker.js.map