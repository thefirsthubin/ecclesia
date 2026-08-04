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
 * React Native equivalent of `ui-web`'s `LineChart`, via `react-native-svg`
 * (already this library's dependency for icons, so no new package). Same
 * computed-summary `accessibilityLabel` approach and the same disclosed
 * simplification - see `ui-web`'s `LineChart.tsx` doc comment for the full
 * accessibility reasoning, not repeated here.
 */
export declare function LineChart({ data, height, color, testId }: LineChartProps): import("react").JSX.Element;
//# sourceMappingURL=LineChart.d.ts.map