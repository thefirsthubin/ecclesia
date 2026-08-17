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
 * `[Product Experience Sprint II, Phase 4]` `width` (`data.length * 60`)
 * sizes the internal coordinate space via `viewBox` only now - the `<svg>`
 * itself no longer carries that as a hard pixel `width` attribute. It
 * previously did, which was a real, found-in-production overflow bug:
 * a fixed-pixel SVG is an intrinsic-size element that forces any
 * ancestor `grid`/`flex` container without its own `minWidth: 0` to grow
 * to fit it rather than let the chart shrink - on `ResidentPastorDashboard`
 * specifically, a 6-month series (`width = 360`) was silently forcing its
 * entire dashboard region (every sibling card in that row, not just this
 * chart) wider than the viewport on narrow screens. `width: '100%'`
 * lets the rendered box follow its container; `maxWidth` pins it to the
 * chart's own natural size so it doesn't stretch beyond that on a wide
 * screen; `viewBox` keeps the point math and aspect ratio unchanged.
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
    <svg
      data-testid={testId}
      role="img"
      aria-label={summary}
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', maxWidth: width, height: 'auto', display: 'block' }}
    >
      <polyline points={polylinePoints} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <circle key={p.datum.label} cx={p.x} cy={p.y} r={3} fill={strokeColor} />
      ))}
    </svg>
  );
}
