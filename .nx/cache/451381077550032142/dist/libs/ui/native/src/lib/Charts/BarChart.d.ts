export interface BarChartDatum {
    label: string;
    value: number;
    color?: string;
}
export interface BarChartProps {
    data: BarChartDatum[];
    height?: number;
    formatValue?: (value: number) => string;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `BarChart` - same plain-`View`
 * approach (no `react-native-svg` needed for straight bars), same
 * accessibility choice: each value is real visible `Text`, not encoded
 * only in bar height.
 */
export declare function BarChart({ data, height, formatValue, testId }: BarChartProps): import("react").JSX.Element;
//# sourceMappingURL=BarChart.d.ts.map