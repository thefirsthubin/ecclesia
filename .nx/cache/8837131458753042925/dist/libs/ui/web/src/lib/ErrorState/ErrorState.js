"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorState = ErrorState;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Heading_1 = require("../Heading");
const Text_1 = require("../Text");
const Button_1 = require("../Button");
/** A designed failure state with a path forward (Design System v1.0 Part 7.20) - never a dead end. */
function ErrorState({ title, description, onRetry, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": testId, role: "alert", style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: theme.spacing[2],
            padding: theme.spacing[8],
        }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "alertCircle", size: "lg", color: theme.colors.status.danger.strong }), (0, jsx_runtime_1.jsx)(Heading_1.Heading, { level: 3, children: title }), description && ((0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "bodySmall", color: theme.colors.text.secondary, children: description })), onRetry && ((0, jsx_runtime_1.jsx)(Button_1.Button, { variant: "secondary", onClick: onRetry, children: "Retry" }))] }));
}
//# sourceMappingURL=ErrorState.js.map