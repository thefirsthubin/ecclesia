import { useTheme } from '../ThemeProvider';

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
export function BarChart({ data, height = 160, formatValue = (v) => String(v), testId }: BarChartProps) {
  const theme = useTheme();
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  return (
    <div
      data-testid={testId}
      style={{ display: 'flex', alignItems: 'flex-end', gap: theme.spacing[3], height, paddingTop: theme.spacing[4] }}
    >
      {data.map((datum) => {
        const barHeight = Math.max(2, (datum.value / maxValue) * (height - 40));
        return (
          <div key={datum.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontFamily: theme.fontFamily.base,
                fontSize: theme.typography.caption.fontSize,
                fontWeight: 600,
                color: theme.colors.text.primary,
              }}
            >
              {formatValue(datum.value)}
            </span>
            <div
              aria-hidden
              style={{
                width: '100%',
                maxWidth: 40,
                height: barHeight,
                borderRadius: theme.radius.sm,
                backgroundColor: datum.color ?? theme.colors.brand.default,
              }}
            />
            <span
              style={{
                fontFamily: theme.fontFamily.base,
                fontSize: theme.typography.caption.fontSize,
                color: theme.colors.text.secondary,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {datum.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
