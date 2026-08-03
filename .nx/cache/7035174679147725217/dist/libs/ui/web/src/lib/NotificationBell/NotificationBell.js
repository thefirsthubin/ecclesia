"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationBell = NotificationBell;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Text_1 = require("../Text");
/**
 * Top-bar notification area (Design System §3.1's "Notification Area").
 * A disclosure button (`aria-expanded`/`aria-haspopup`) rather than a
 * hover-only flyout, so it's fully keyboard-operable (STEP 8).
 */
function NotificationBell({ count, children, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [open, setOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, "data-testid": testId, children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", "aria-haspopup": "true", "aria-expanded": open, "aria-label": count > 0 ? `Notifications, ${count} unread` : 'Notifications', onClick: () => setOpen((o) => !o), style: {
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: theme.spacing[2],
                    borderRadius: theme.radius.sm,
                }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "bell", size: "md" }), count > 0 && ((0, jsx_runtime_1.jsx)("span", { "aria-hidden": "true", style: {
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            minWidth: 16,
                            height: 16,
                            borderRadius: theme.radius.full,
                            backgroundColor: theme.colors.status.danger.strong,
                            color: theme.colors.text.inverse,
                            fontSize: 10,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 3px',
                        }, children: count > 9 ? '9+' : count }))] }), open && ((0, jsx_runtime_1.jsx)("div", { role: "dialog", "aria-label": "Notifications", style: {
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: theme.spacing[2],
                    width: 320,
                    maxHeight: 400,
                    overflowY: 'auto',
                    backgroundColor: theme.colors.surface.raised,
                    border: `1px solid ${theme.colors.border.subtle}`,
                    borderRadius: theme.radius.md,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: theme.spacing[3],
                    zIndex: theme.zIndex.overlay,
                }, children: count === 0 ? (0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "bodySmall", color: theme.colors.text.secondary, children: "No new notifications." }) : children }))] }));
}
//# sourceMappingURL=NotificationBell.js.map