"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorState = ErrorState;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
const Icon_1 = require("../Icon");
const Heading_1 = require("../Heading");
const Text_1 = require("../Text");
const Button_1 = require("../Button");
/** React Native equivalent of `ui-web`'s `ErrorState` - `accessibilityLiveRegion="assertive"` is RN's analogue of ARIA's `role="alert"`. */
function ErrorState({ title, description, onRetry, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { testID: testId, accessibilityLiveRegion: "assertive", style: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.spacing[8],
            paddingHorizontal: theme.spacing[4],
            gap: theme.spacing[3],
        }, children: [(0, jsx_runtime_1.jsx)(Icon_1.Icon, { name: "alertTriangle", size: "lg", color: theme.colors.status.danger.strong }), (0, jsx_runtime_1.jsx)(Heading_1.Heading, { level: 3, color: theme.colors.text.primary, children: title }), description && ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: { maxWidth: 320 }, children: (0, jsx_runtime_1.jsx)(Text_1.Text, { variant: "body", color: theme.colors.text.secondary, children: description }) })), onRetry && ((0, jsx_runtime_1.jsx)(Button_1.Button, { variant: "secondary", onPress: onRetry, testId: testId ? `${testId}-retry` : undefined, children: "Retry" }))] }));
}
//# sourceMappingURL=ErrorState.js.map