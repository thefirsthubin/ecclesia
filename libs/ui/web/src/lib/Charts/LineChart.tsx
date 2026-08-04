import { useTheme } from '../ThemeProvider';

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
export function LineChart({ data, height = 160, color, testId }: LineChartProps) {
  const theme = useTheme();
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

  return (
    <svg data-testid={testId} role="img" aria-label={summary} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={polylinePoints} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <circle key={p.datum.label} cx={p.x} cy={p.y} r={3} fill={strokeColor} />
      ))}
    </svg>
  );
}
