import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Heading } from '../Heading';
import { Text } from '../Text';
import type { IconName } from '@ecclesia/ui-core';

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
  /**
   * `neutral` (default - "no data yet"/"no results") reads plainly.
   * `positive` is Design System v1.0 Part 7.18's `all-clear` case - an
   * empty priority zone is *good news* ("Nothing needs your attention
   * today") and must read as calm reassurance, not as an error or a
   * broken screen.
   */
  tone?: 'neutral' | 'positive';
  testId?: string;
}

/** A designed state for "this list/table/zone has no content" (Design System v1.0 Part 7.18) - never a blank gap. */
export function EmptyState({ icon, title, description, action, tone = 'neutral', testId }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[8],
      }}
    >
      {icon && <Icon name={icon} size="lg" color={tone === 'positive' ? theme.colors.status.success.strong : theme.colors.text.secondary} />}
      <Heading level={3}>{title}</Heading>
      {description && (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {description}
        </Text>
      )}
      {action}
    </div>
  );
}
