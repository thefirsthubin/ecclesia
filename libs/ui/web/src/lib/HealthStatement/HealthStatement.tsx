import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Sparkline } from '../Charts';
import type { SparklineDatum } from '../Charts';

export type HealthStatementTone = 'positive' | 'neutral' | 'attention';

export interface HealthStatementProps {
  /** The one number or short phrase this screen leads with - always real,
   * never interpreted/invented text. Rendered at `Heading level="display"`
   * (Part 4.3's "used sparingly, at most once per screen" role) - this
   * component IS that one use. */
  headline: string;
  /** One real, factual sentence explaining the headline - e.g. "3
   * Bacentas need attention this week," never a generated platitude. */
  statement: string;
  tone?: HealthStatementTone;
  /** Real trend data only - omit entirely rather than pass a
   * single-point/fabricated series. */
  trend?: SparklineDatum[];
  trailing?: ReactNode;
  testId?: string;
}

/**
 * `[Branch Pastor portal, visual redesign]` The one "editorial thesis"
 * moment this system spends per screen - "how is my branch doing," said
 * once, with real authority, instead of a KPI strip nobody's eye lands
 * on. Direction contract: this is the FIRST VIEWPORT block's own
 * embodiment (see `PRODUCT.md`'s incumbent-evidence trail and this
 * sprint's own direction notes) - large Fraunces headline, one real
 * sentence, and a real inline trend when the underlying data exists.
 * Deliberately not the banned "hero-metric template" (big number + small
 * label + supporting stats + accent) - there is no small label, no
 * stat-tile row; the headline and its one sentence ARE the content, nothing
 * subordinate is stacked beneath them decoratively.
 */
export function HealthStatement({ headline, statement, tone = 'neutral', trend, trailing, testId }: HealthStatementProps) {
  const theme = useTheme();
  const toneColor = tone === 'positive' ? theme.colors.brand.default : tone === 'attention' ? theme.colors.status.warning.strong : theme.colors.text.primary;

  return (
    <div data-testid={testId} style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: theme.spacing[6], flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2], minWidth: 0 }}>
        <Heading level="display" color={toneColor}>
          {headline}
        </Heading>
        <Text variant="body" color={theme.colors.text.secondary}>
          {statement}
        </Text>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
        {trend && trend.length >= 2 && <Sparkline data={trend} width={140} height={40} color={toneColor} />}
        {trailing}
      </div>
    </div>
  );
}
