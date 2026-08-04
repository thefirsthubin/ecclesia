"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMenu = UserMenu;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ThemeProvider_1 = require("../ThemeProvider");
const Avatar_1 = require("../Avatar");
const Icon_1 = require("../Icon");
const Text_1 = require("../Text");
/**
 * Top-bar user menu (Design System §3.1's "User Menu") - identity display
 * plus logout (STEP 4). A disclosure button, same keyboard-operable
 * pattern as `NotificationBell`.
 */
function UserMenu({ name, roleLabel, onLogout, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const [open, setOpen] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { style: { position: 'relative' }, "data-testid": testId, children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", "aria-haspopup": "true", "aria-expanded": open, "aria-label": `Account menu for ${name}`, onClick: () => setOpen((o) => !o), style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing[2],
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: theme.spacing[1],
                    borderRadius: theme.radius.sm,
                }, children: [(0, jsx_runtime_1.jsx)(Avatar_1.Avatar, { name: name, size: "sm" }), (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "chevronDown", size: "sm" })] }), open && ((0, jsx_runtime_1.jsxs)("div", { role: "menu", "aria-label": `${name}'s account menu`, style: {
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: theme.spacing[2],
                    minWidth: 200,
                    backgroundColor: theme.colors.surface.raised,
                    border: `1px solid ${theme.colors.border.subtle}`,
                    borderRadius: theme.radius.md,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    padding: theme.spacing[2],
                    zIndex: theme.zIndex.overlay,
                }, children: [(0, jsx_runtime_1.jsxs)("div", { style: { padding: theme.spacing[2], display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }, children: [(0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "bodySmall", children: name }), (0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "caption", color: theme.colors.text.secondary, children: roleLabel })] }), (0, jsx_runtime_1.jsx)("button", { type: "button", role: "menuitem", onClick: () => {
                            setOpen(false);
                            onLogout();
                        }, style: {
                            width: '100%',
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: theme.spacing[2],
                            borderRadius: theme.radius.sm,
                            color: theme.colors.text.primary,
                            font: 'inherit',
                        }, children: "Log out" })] }))] }));
}
//# sourceMappingURL=UserMenu.js.map