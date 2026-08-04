"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineChart = LineChart;
const tslib_1 = require("tslib");
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_svg_1 = tslib_1.__importStar(require("react-native-svg"));
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * React Native equivalent of `ui-web`'s `LineChart`, via `react-native-svg`
 * (already this library's dependency for icons, so no new package). Same
 * computed-summary `accessibilityLabel` approach and the same disclosed
 * simplification - see `ui-web`'s `LineChart.tsx` doc comment for the full
 * accessibility reasoning, not repeated here.
 */
function LineChart({ data, height = 160, color, testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const strokeColor = color ?? theme.colors.brand.default;
    const width = Math.max(200, data.length * 60);
    const padding = 16;
    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = Math.max(1, maxValue - minValue);
    const points = data.map((datum, index) => {
        const x = data.length === 1 ? width / 2 : padding + (index / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((datum.value - minValue) / range) * (height - padding * 2);
        return { x, y, datum };
    });
    const first = data[0];
    const last = data[data.length - 1];
    const direction = last && first ? (last.value > first.value ? 'trending up' : last.value < first.value ? 'trending down' : 'flat') : '';
    const summary = first && last ? `Line chart from ${first.label}: ${first.value} to ${last.label}: ${last.value}, ${direction}` : 'Line chart, no data';
    return ((0, jsx_runtime_1.jsxs)(react_native_svg_1.default, { testID: testId, accessible: true, accessibilityLabel: summary, width: width, height: height, viewBox: `0 0 ${width} ${height}`, children: [(0, jsx_runtime_1.jsx)(react_native_svg_1.Polyline, { points: points.map((p) => `${p.x},${p.y}`).join(' '), fill: "none", stroke: strokeColor, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }), points.map((p) => ((0, jsx_runtime_1.jsx)(react_native_svg_1.Circle, { cx: p.x, cy: p.y, r: 3, fill: strokeColor }, p.datum.label)))] }));
}
//# sourceMappingURL=LineChart.js.map