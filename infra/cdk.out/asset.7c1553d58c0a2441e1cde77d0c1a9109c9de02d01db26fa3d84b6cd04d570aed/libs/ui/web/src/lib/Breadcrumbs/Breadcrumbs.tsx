import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type BreadcrumbLinkComponent = ComponentType<{ to: string; children: ReactNode }>;

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  linkAs: BreadcrumbLinkComponent;
  testId?: string;
}

/**
 * Design System v1.0 §3.1: nav depth is capped at 3 (Domain → Surface →
 * Record detail) - breadcrumbs make that depth visible and give a
 * one-click way back up it. The final item (current page) is not a link
 * (`aria-current="page"` on plain text), matching standard breadcrumb a11y
 * pattern.
 */
export function Breadcrumbs({ items, linkAs: LinkAs, testId }: BreadcrumbsProps) {
  const theme = useTheme();

  return (
    <nav aria-label="Breadcrumb" data-testid={testId}>
      <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0, gap: theme.spacing[1] }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
              {index > 0 && <Icon name="chevronRight" size="sm" />}
              {item.href && !isLast ? (
                <LinkAs to={item.href}>
                  <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                    {item.label}
                  </Text>
                </LinkAs>
              ) : (
                <Text as="span" variant="bodySmall" color={theme.colors.text.primary}>
                  <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
                </Text>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
