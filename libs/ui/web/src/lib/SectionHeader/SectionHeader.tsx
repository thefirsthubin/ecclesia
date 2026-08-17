import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Heading } from '../Heading';
import { Text } from '../Text';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned slot - a count, a "View all" link, a small filter
   * control. Never a second heading. */
  action?: ReactNode;
  testId?: string;
}

/**
 * `[Branch Pastor portal, visual redesign]` Opens one module inside a
 * page (a table, a chart, a list) - `Heading level={3}` plus an optional
 * one-line description, the same shape already used ad hoc across every
 * Branch Pastor page's own section blocks, now consistent. Deliberately
 * no numbering (01/02/03) - `reference/craft-floor.md`'s own "Refuse"
 * list: numbering only earns its place when sequence itself carries
 * information, which none of these sections' order does.
 */
export function SectionHeader({ title, description, action, testId }: SectionHeaderProps) {
  const theme = useTheme();
  return (
    <div data-testid={testId} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[3] }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
        <Heading level={3}>{title}</Heading>
        {description && (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {description}
          </Text>
        )}
      </div>
      {action}
    </div>
  );
}
