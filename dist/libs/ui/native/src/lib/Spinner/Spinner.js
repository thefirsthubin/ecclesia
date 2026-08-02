"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = Spinner;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `Spinner`. Uses the platform-
 * native `ActivityIndicator` rather than a hand-rolled rotating view -
 * RN's own component already animates correctly on both iOS and Android
 * and is what every accessibility service on those platforms expects to
 * see for a loading state, so re-implementing it (as `ui-web` reasonably
 * does, since the DOM has no native spinner) would be working against
 * the platform, not with it.
 */
function Spinner({ size = 'md', color, label = 'Loading' }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const rnSize = size === 'lg' ? 'large' : 'small';
    return ((0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { size: rnSize, color: color ?? theme.colors.brand.default, accessibilityRole: "progressbar", accessibilityLabel: label }));
}
//# sourceMappingURL=Spinner.js.map