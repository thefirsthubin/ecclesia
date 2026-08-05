"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastProvider = ToastProvider;
exports.useToast = useToast;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
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
 * React Native equivalent of `ui-web`'s `ToastProvider`/`useToast`. RN has
 * no DOM-portal concept, so instead of portaling to a document root, this
 * provider renders the toast stack as an absolutely-positioned `View`
 * layered over its own `children` - the same expectation as `ui-web`'s
 * version, mount once near the app root. `pointerEvents="box-none"` on the
 * covering layer lets touches pass through to whatever's underneath
 * except where an actual toast card is rendered, so a toast never blocks
 * interaction with the rest of the screen the way `Modal`'s scrim
 * deliberately does.
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
    return ((0, jsx_runtime_1.jsxs)(ToastContext.Provider, { value: value, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: { flex: 1 }, children: children }), (0, jsx_runtime_1.jsx)(react_native_1.View, { pointerEvents: "box-none", style: { position: 'absolute', bottom: theme.spacing[6], left: theme.spacing[4], right: theme.spacing[4], gap: theme.spacing[2] }, children: toasts.map((toast) => {
                    const statusTokens = theme.colors.status[toast.status];
                    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: `toast-${toast.id}`, accessible: true, accessibilityRole: "alert", accessibilityLiveRegion: toast.status === 'danger' ? 'assertive' : 'polite', style: {
                            flexDirection: 'row',
                            alignItems: 'flex-start',
                            gap: theme.spacing[2],
                            padding: theme.spacing[3],
                            borderRadius: theme.radius.md,
                            borderWidth: 1,
                            borderColor: statusTokens.border,
                            backgroundColor: statusTokens.background,
                        }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: STATUS_ICON[toast.status], size: "sm", color: statusTokens.foreground }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { flex: 1, gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, fontWeight: '600', color: statusTokens.foreground }, children: toast.message }), toast.description && ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: statusTokens.foreground }, children: toast.description }))] }), (0, jsx_runtime_1.jsx)(react_native_1.Pressable, { onPress: () => dismiss(toast.id), accessibilityRole: "button", accessibilityLabel: "Dismiss notification", hitSlop: 8, children: (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "close", size: "sm", color: statusTokens.foreground }) })] }, toast.id));
                }) })] }));
}
function useToast() {
    const context = (0, react_1.useContext)(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
//# sourceMappingURL=ToastProvider.js.map