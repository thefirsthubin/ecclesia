import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Divider } from '../Divider';
import { Text } from '../Text';
import { EmptyState } from '../EmptyState';
import type { EmptyStateProps } from '../EmptyState';

export interface AttentionListItem {
  id: string;
  /** A short, uppercase-rendered label - a Bacenta name, "BRANCH-WIDE", a
   * person's name. Never omitted; it is what makes five stacked rows
   * scannable instead of a paragraph. */
  label: string;
  description: string;
  action?: ReactNode;
}

export interface AttentionListProps {
  items: AttentionListItem[];
  emptyState: Pick<EmptyStateProps, 'icon' | 'title' | 'description'>;
  testId?: string;
}

/**
 * `[Branch Pastor portal, visual redesign]` One real, reusable list shape
 * for "things that need a Pastor's attention" - the Dashboard's own Needs
 * Attention rows, and Pastoral Care's Overdue/My Follow-ups lists, were
 * three independently hand-rolled near-duplicates of this exact shape
 * before this pass. Renders rows only (no `Card`, no heading, no loading/
 * error state) - the same contract `Table` already establishes, so a
 * caller composes it inside its own `Card`/`SectionHeader` exactly like
 * every other list primitive in this system.
 */
export function AttentionList({ items, emptyState, testId }: AttentionListProps) {
  const theme = useTheme();

  if (items.length === 0) {
    return <EmptyState tone="positive" {...emptyState} />;
  }

  return (
    <div data-testid={testId} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
      {items.map((item, index) => (
        <div key={item.id}>
          {index > 0 && <Divider />}
          <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
              <Text as="span" variant="label" color={theme.colors.text.secondary}>
                {item.label.toUpperCase()}
              </Text>
              {item.action}
            </div>
            <Text variant="bodySmall">{item.description}</Text>
          </div>
        </div>
      ))}
    </div>
  );
}
