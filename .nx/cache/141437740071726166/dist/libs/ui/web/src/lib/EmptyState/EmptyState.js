"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = EmptyState;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Heading_1 = require("../Heading");
const Text_1 = require("../Text");
/** A designed state for "this list/table/zone has no content" (Design System v1.0 Part 7.18) - never a blank gap. */
function EmptyState({ icon, title, description, action, tone = 'neutral', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)("div", { "data-testid": testId, style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: theme.spacing[2],
            padding: theme.spacing[8],
        }, children: [icon && (0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: icon, size: "lg", color: tone === 'positive' ? theme.colors.status.success.strong : theme.colors.text.secondary }), (0, jsx_runtime_1.jsx)(Heading_1.Heading, { level: 3, children: title }), description && ((0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "bodySmall", color: theme.colors.text.secondary, children: description })), action] }));
}
//# sourceMappingURL=EmptyState.js.map