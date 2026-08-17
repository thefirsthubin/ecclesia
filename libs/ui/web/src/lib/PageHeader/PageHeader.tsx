import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';
import { Text } from '../Text';

export interface PageHeaderProps {
  title: string;
  /** A single real context line under the title - e.g. "Headquarters ·
   * Week of Aug 10 - 16". Never a fabricated tagline. */
  context?: string;
  /** Right-aligned slot for a status glance (a `Badge`) or a primary
   * action (a `Button`) - at most one of these per header, matching the
   * "one primary action per screen" rule; never both stacked. */
  action?: ReactNode;
  testId?: string;
}

/**
 * `[Branch Pastor portal, visual redesign]` The one page-opening pattern
 * every Branch Pastor screen now shares, replacing five hand-rolled
 * near-duplicates (`BranchPastorDashboard`, `BranchGatheringsView`,
 * `BranchFinanceOverviewPage`, `BranchInsightsView`, and
 * `FollowUpTaskQueuePage`'s own header blocks). Deliberately narrow: a
 * title, one real context line, one optional action slot. No eyebrow/
 * kicker label above the title (`reference/craft-floor.md`'s own
 * "Refuse" list bans this outright - the heading carries its own weight),
 * no decorative icon, no gradient. The title always renders in the
 * display/editorial register (`Heading level={1}`, Fraunces) - the one
 * place per screen this system spends its typographic confidence.
 */
export function PageHeader({ title, context, action, testId }: PageHeaderProps) {
  const theme = useTheme();
  return (
    <div
      data-testid={testId}
      style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[4], flexWrap: 'wrap' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Heading level={1}>{title}</Heading>
        {context && (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {context}
          </Text>
        )}
      </div>
      {action}
    </div>
  );
}
