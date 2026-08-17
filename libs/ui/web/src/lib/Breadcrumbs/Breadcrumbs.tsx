import { useState, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Text } from '../Text';

export type BreadcrumbLinkComponent = ComponentType<{
  to: string;
  children: ReactNode;
  style?: { textDecoration: string; outline: string };
  onFocus?: () => void;
  onBlur?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>;

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
 *
 * `[Sidebar underline fix]` `textDecoration: 'none'` on `LinkAs`, same
 * fix and same reasoning as `Sidebar`'s own `LinkAs` call - a plain,
 * unconditional inline style, so it covers every interaction state at
 * once (nothing anywhere re-applies the browser's default underline for
 * hover/focus/active/visited specifically).
 *
 * `[Product Experience Sprint II, Phase 3 - AppShell pass]` Breadcrumb
 * links previously had *no* hover or focus styling at all - unlike every
 * other interactive element in the shell, hovering one gave no feedback,
 * and keyboard focus fell back to the browser's unstyled default outline
 * instead of the on-brand ring `Sidebar`/`Button`/`Input` already use.
 * Same `hoveredIndex`/`focusedIndex` local-state pattern `Sidebar` uses
 * for its own hover/focus tracking - text darkens from `text.secondary`
 * to `text.primary` on hover (a real, visible affordance a "this is
 * clickable" cue that isn't color-coded meaning), and focus gets the
 * standard 2px `border.focus` outline.
 */
export function Breadcrumbs({ items, linkAs: LinkAs, testId }: BreadcrumbsProps) {
  const theme = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined);
  const [focusedIndex, setFocusedIndex] = useState<number | undefined>(undefined);

  return (
    <nav aria-label="Breadcrumb" data-testid={testId} style={{ minWidth: 0 }}>
      {/* `[Product Experience Sprint II, Phase 5]` `flexWrap: 'wrap'` - a
          deep trail (e.g. `Dashboard > People > Person`) previously had no
          way to give up horizontal space at all, which contributed to a
          real overflow bug on narrow screens (`TopBar`'s own doc comment
          has the fuller trace). Wrapping onto a second line reads better
          than truncating any one crumb - there's no "least important"
          segment in a breadcrumb trail to cut. */}
      <ol style={{ listStyle: 'none', display: 'flex', alignItems: 'center', flexWrap: 'wrap', rowGap: theme.spacing[1], margin: 0, padding: 0, gap: theme.spacing[1] }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isInteractionTarget = hoveredIndex === index || focusedIndex === index;
          return (
            <li key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
              {index > 0 && <Icon name="chevronRight" size="sm" color={theme.colors.text.secondary} />}
              {item.href && !isLast ? (
                <LinkAs
                  to={item.href}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(undefined)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(undefined)}
                  style={{
                    textDecoration: 'none',
                    outline: focusedIndex === index ? `2px solid ${theme.colors.border.focus}` : 'none',
                  }}
                >
                  <Text as="span" variant="bodySmall" color={isInteractionTarget ? theme.colors.text.primary : theme.colors.text.secondary}>
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
