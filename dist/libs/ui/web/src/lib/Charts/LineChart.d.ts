export interface LineChartDatum {
    label: string;
    value: number;
}
export interface LineChartProps {
    data: LineChartDatum[];
    height?: number;
    color?: string;
    testId?: string;
}
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
export declare function LineChart({ data, height, color, testId }: LineChartProps): import("react").JSX.Element;
//# sourceMappingURL=LineChart.d.ts.map