import { useTheme } from '../ThemeProvider';

export interface SparklineDatum {
  label: string;
  value: number;
}

export interface SparklineProps {
  data: SparklineDatum[];
  width?: number;
  height?: number;
  color?: string;
  testId?: string;
}

/**
 * `[Dashboard Visual Redesign]` A minimal, dependency-free inline trend
 * line - same plain `<svg>` + `<polyline>` approach as `LineChart`, sized
 * for sitting inline next to a KPI number rather than as its own chart
 * card. Deliberately not `LineChart` reused at a small size: `LineChart`
 * renders a per-point `<circle>` and a `role="img"` summary `aria-label`
 * because it is often the primary content of its own card; a sparkline is
 * always a decorative accompaniment to a number/trend that is already
 * real, visible text right next to it (`KpiCard`'s own
 * `trendDirection`/`trendLabel`), so it is `aria-hidden` here rather than
 * duplicating that same information into a second, redundant `aria-label`
 * (the "status/trend is never color/shape alone" rule is already
 * satisfied by the text it sits beside, not by this element itself).
 */
export function Sparkline({ data, width = 96, height = 32, color, testId }: SparklineProps) {
  const theme = useTheme();
  const strokeColor = color ?? theme.colors.brand.default;

  if (data.length < 2) return null;

  const padding = 3;
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(1, maxValue - minValue);

  const points = data.map((datum, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((datum.value - minValue) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg data-testid={testId} aria-hidden width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={points.join(' ')} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
