"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineChart = LineChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A minimal, dependency-free line/trend chart (see `BarChart.tsx` for why
 * this library doesn't pull in a charting package). Plain `<svg>` +
 * `<polyline>`/`<circle>` - no animation library, no new dependency.
 *
 * **Accessibility**: unlike `BarChart` (where each value is real visible
 * text), a trend line's actual information - the *shape* of change over
 * time - genuinely doesn't reduce to a short text alternative without
 * losing the point of the visualization. This component provides a
 * computed `aria-label` summarizing start, end, and direction (e.g.
 * "Line chart from Jan: 62 to Jun: 78, trending up") on the `role="img"`
 * container - a reasonable, honest simplification, not a claim of full
 * accessibility parity. A caller with a genuine need for the underlying
 * per-point data to be screen-reader-navigable should render an
 * accompanying data table (e.g. via `Table`) - the same "caller
 * responsibility for the fuller case" pattern `Badge`'s color-alone
 * warning documents.
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
    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
    const first = data[0];
    const last = data[data.length - 1];
    const direction = last && first ? (last.value > first.value ? 'trending up' : last.value < first.value ? 'trending down' : 'flat') : '';
    const summary = first && last ? `Line chart from ${first.label}: ${first.value} to ${last.label}: ${last.value}, ${direction}` : 'Line chart, no data';
    return ((0, jsx_runtime_1.jsxs)("svg", { "data-testid": testId, role: "img", "aria-label": summary, width: width, height: height, viewBox: `0 0 ${width} ${height}`, children: [(0, jsx_runtime_1.jsx)("polyline", { points: polylinePoints, fill: "none", stroke: strokeColor, strokeWidth: 2, strokeLinejoin: "round", strokeLinecap: "round" }), points.map((p) => ((0, jsx_runtime_1.jsx)("circle", { cx: p.x, cy: p.y, r: 3, fill: strokeColor }, p.datum.label)))] }));
}
//# sourceMappingURL=LineChart.js.map