"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastProvider = ToastProvider;
exports.useToast = useToast;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_dom_1 = require("react-dom");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const ToastContext = (0, react_1.createContext)(null);
const STATUS_ICON = {
    success: 'checkCircle',
    warning: 'alertTriangle',
    danger: 'xCircle',
    info: 'infoCircle',
    neutral: 'infoCircle',
};
/**
 * Transient status messaging (Design System v1.0 Part 7.8's Toast/Snackbar
 * concept). Unlike `Modal` (one caller, one `isOpen` flag tied to a
 * specific action), a toast can be triggered from anywhere in the tree -
 * a save handler deep in a form, a background sync completing - so this
 * is a context provider + `useToast()` hook, not a purely
 * caller-controlled presentational component. Mount once near the app
 * root (same expectation as `ThemeProvider`).
 *
 * Portals to `document.body` at `zIndex.toast` (the token reserved for
 * exactly this, previously unused), stacking newest-on-top in the
 * bottom-right corner. Each toast is `role="status"` +
 * `aria-live="polite"` (`"assertive"` for `danger`, since an error toast
 * is worth interrupting screen-reader output for) so assistive tech
 * announces it without the person needing to navigate to find it.
 */
function ToastProvider({ children }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const timers = (0, react_1.useRef)(new Map());
    const dismiss = (0, react_1.useCallback)((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);
    const show = (0, react_1.useCallback)((options) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const duration = options.duration ?? 5000;
        const toast = { id, status: options.status ?? 'neutral', message: options.message, description: options.description, duration };
        setToasts((current) => [...current, toast]);
        if (duration > 0) {
            timers.current.set(id, setTimeout(() => dismiss(id), duration));
        }
        return id;
    }, [dismiss]);
    const value = (0, react_1.useMemo)(() => ({ show, dismiss }), [show, dismiss]);
    return ((0, jsx_runtime_1.jsxs)(ToastContext.Provider, { value: value, children: [children, (0, react_dom_1.createPortal)((0, jsx_runtime_1.jsx)("div", { style: {
                    position: 'fixed',
                    bottom: theme.spacing[4],
                    right: theme.spacing[4],
                    zIndex: theme.zIndex.toast,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: theme.spacing[2],
                    width: 360,
                    maxWidth: '90vw',
                }, children: toasts.map((toast) => {
                    const statusTokens = theme.colors.status[toast.status];
                    return ((0, jsx_runtime_1.jsxs)("div", { role: "status", "aria-live": toast.status === 'danger' ? 'assertive' : 'polite', "data-testid": `toast-${toast.id}`, style: {
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: theme.spacing[2],
                            padding: theme.spacing[3],
                            borderRadius: theme.radius.md,
                            border: `1px solid ${statusTokens.border}`,
                            backgroundColor: statusTokens.background,
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
                        }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: STATUS_ICON[toast.status], size: "sm", color: statusTokens.foreground }), (0, jsx_runtime_1.jsxs)("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)("span", { style: {
                                            fontFamily: theme.fontFamily.base,
                                            fontSize: theme.typography.body.fontSize,
                                            fontWeight: 600,
                                            color: statusTokens.foreground,
                                        }, children: toast.message }), toast.description && ((0, jsx_runtime_1.jsx)("span", { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: statusTokens.foreground }, children: toast.description }))] }), (0, jsx_runtime_1.jsx)("button", { type: "button", "aria-label": "Dismiss notification", onClick: () => dismiss(toast.id), style: {
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    cursor: 'pointer',
                                    color: statusTokens.foreground,
                                    lineHeight: 0,
                                }, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm", color: statusTokens.foreground }) })] }, toast.id));
                }) }), document.body)] }));
}
/** Throws outside a `ToastProvider` - unlike `useTheme` (which silently falls back to light mode via a context default), there is no sane default toast queue to fall back to, so this fails loudly instead. */
function useToast() {
    const context = (0, react_1.useContext)(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
//# sourceMappingURL=ToastProvider.js.map