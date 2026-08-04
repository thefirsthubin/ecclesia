export interface BarChartDatum {
    label: string;
    value: number;
    /** Overrides the default brand color for this one bar - e.g. coloring a Church Pulse band per Part 10.1's band colors. */
    color?: string;
}
export interface BarChartProps {
    data: BarChartDatum[];
    height?: number;
    /** Formats the value shown above each bar - defaults to the raw number. Pass e.g. `(v) => \`GHS ${v}\`` for currency. */
    formatValue?: (value: number) => string;
    testId?: string;
}
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
export declare function BarChart({ data, height, formatValue, testId }: BarChartProps): import("react").JSX.Element;
//# sourceMappingURL=BarChart.d.ts.map