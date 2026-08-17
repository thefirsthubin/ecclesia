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
  /** `[Branch Pastor Dashboard sprint, spec revision]` `'vertical'` (default,
   * original behavior, unchanged) or `'horizontal'` - a ranked list of
   * label/track/value rows, one per datum. Prefer `'horizontal'` for
   * ranked category comparisons with real (often longer) names - a
   * Bacenta's name reads in full on its own row instead of being
   * truncated under a narrow vertical bar, and the ranking itself (top
   * row = highest, per this component's `data`-order-is-render-order
   * contract - callers sort descending before passing data in) is easier
   * to scan top-to-bottom than left-to-right. `height` is ignored in this
   * mode - row height follows content (one row per datum), not a fixed
   * pixel box, the same way an ordinary list would. */
  orientation?: 'vertical' | 'horizontal';
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
 * visible DOM text (not embedded only in the bar's size or a tooltip) -
 * a screen reader reads the label and value in normal document flow, no
 * `role="img"`/summary-string workaround needed. The bar/track shape
 * itself is `aria-hidden` (decorative; the text already carries the
 * information) in both orientations.
 */
export function BarChart({ data, height = 160, formatValue = (v) => String(v), orientation = 'vertical', testId }: BarChartProps) {
  const theme = useTheme();
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  if (orientation === 'horizontal') {
    return (
      <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        {data.map((datum) => {
          const fillPercent = Math.max(2, (datum.value / maxValue) * 100);
          return (
            <div key={datum.label} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
              <span
                style={{
                  width: 96,
                  flexShrink: 0,
                  fontFamily: theme.fontFamily.base,
                  fontSize: theme.typography.bodySmall.fontSize,
                  color: theme.colors.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={datum.label}
              >
                {datum.label}
              </span>
              <div aria-hidden style={{ flex: 1, height: 8, borderRadius: theme.radius.full, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
                <div style={{ width: `${fillPercent}%`, height: '100%', borderRadius: theme.radius.full, backgroundColor: datum.color ?? theme.colors.brand.default }} />
              </div>
              <span
                style={{
                  width: 64,
                  flexShrink: 0,
                  textAlign: 'right',
                  fontFamily: theme.fontFamily.base,
                  fontSize: theme.typography.numericTabular.fontSize,
                  fontVariantNumeric: 'tabular-nums',
                  fontWeight: 600,
                  color: theme.colors.text.primary,
                }}
              >
                {formatValue(datum.value)}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

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
