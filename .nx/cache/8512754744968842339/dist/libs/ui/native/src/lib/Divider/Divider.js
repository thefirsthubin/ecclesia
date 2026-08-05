"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Divider = Divider;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
function Divider({ orientation = 'horizontal', testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const isHorizontal = orientation === 'horizontal';
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", style: {
            backgroundColor: theme.colors.border.subtle,
            width: isHorizontal ? '100%' : 1,
            height: isHorizontal ? 1 : '100%',
        } }));
}
//# sourceMappingURL=Divider.js.map