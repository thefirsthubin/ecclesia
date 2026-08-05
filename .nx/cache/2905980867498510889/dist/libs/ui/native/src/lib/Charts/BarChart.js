"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarChart = BarChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `BarChart` - same plain-`View`
 * approach (no `react-native-svg` needed for straight bars), same
 * accessibility choice: each value is real visible `Text`, not encoded
 * only in bar height.
 */
function BarChart({ data, height = 160, formatValue = (v) => String(v), testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const maxValue = Math.max(1, ...data.map((d) => d.value));
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { testID: testId, style: { flexDirection: 'row', alignItems: 'flex-end', gap: theme.spacing[3], height, paddingTop: theme.spacing[4] }, children: data.map((datum) => {
            const barHeight = Math.max(2, (datum.value / maxValue) * (height - 40));
            return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: { alignItems: 'center', gap: theme.spacing[1], flex: 1 }, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, fontWeight: '600', color: theme.colors.text.primary }, children: formatValue(datum.value) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants", style: { width: '100%', maxWidth: 40, height: barHeight, borderRadius: theme.radius.sm, backgroundColor: datum.color ?? theme.colors.brand.default } }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { numberOfLines: 1, style: { fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary, textAlign: 'center' }, children: datum.label })] }, datum.label));
        }) }));
}
//# sourceMappingURL=BarChart.js.map