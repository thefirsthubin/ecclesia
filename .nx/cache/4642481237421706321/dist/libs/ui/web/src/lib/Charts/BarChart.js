"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarChart = BarChart;
const jsx_runtime_1 = require("react/jsx-runtime");
const ThemeProvider_1 = require("../ThemeProvider");
/**
 * A minimal, dependency-free bar chart (Design System v1.0 Part 7 Data
 * tier). No charting library dependency - this sandbox/repo has a
 * disclosed history of npm-registry access limits and new-tooling
 * breakage (see `UI_DESIGN_NOTES.md` §1's styling-approach rationale),
 * and a bar chart's actual rendering need here is simple enough not to
 * warrant one.
 *
 * **Accessibility**: each bar's numeric value is rendered as real,
 * visible DOM text above the bar (not embedded only in the bar's height
 * or a tooltip) - a screen reader reads the label and value in normal
 * document flow, no `role="img"`/summary-string workaround needed. The
 * bar shape itself is `aria-hidden` (decorative; the text already
 * carries the information).
 */
function BarChart({ data, height = 160, formatValue = (v) => String(v), testId }) {
    const theme = (0, ThemeProvider_1.useTheme)();
    const maxValue = Math.max(1, ...data.map((d) => d.value));
    return ((0, jsx_runtime_1.jsx)("div", { "data-testid": testId, style: { display: 'flex', alignItems: 'flex-end', gap: theme.spacing[3], height, paddingTop: theme.spacing[4] }, children: data.map((datum) => {
            const barHeight = Math.max(2, (datum.value / maxValue) * (height - 40));
            return ((0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing[1], flex: 1, minWidth: 0 }, children: [(0, jsx_runtime_1.jsx)("span", { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: 600,
                            color: theme.colors.text.primary,
                        }, children: formatValue(datum.value) }), (0, jsx_runtime_1.jsx)("div", { "aria-hidden": true, style: {
                            width: '100%',
                            maxWidth: 40,
                            height: barHeight,
                            borderRadius: theme.radius.sm,
                            backgroundColor: datum.color ?? theme.colors.brand.default,
                        } }), (0, jsx_runtime_1.jsx)("span", { style: {
                            fontFamily: theme.fontFamily.base,
                            fontSize: theme.typography.caption.fontSize,
                            color: theme.colors.text.secondary,
                            textAlign: 'center',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                        }, children: datum.label })] }, datum.label));
        }) }));
}
//# sourceMappingURL=BarChart.js.map