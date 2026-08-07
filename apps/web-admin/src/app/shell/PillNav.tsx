import type { ReactNode } from 'react';
import { Icon, useTheme } from '@ecclesia/ui-web';
import type { SidebarLinkComponent } from '@ecclesia/ui-web';
import type { IconName } from '@ecclesia/ui-core';

export interface PillNavItem {
  label: string;
  href: string;
  icon: IconName;
  active: boolean;
}

export interface PillNavProps {
  items: PillNavItem[];
  linkAs: SidebarLinkComponent;
  /** Notification bell + user menu, same components `AppShell`'s sidebar variant already renders - passed through rather than rebuilt. */
  rightSlot: ReactNode;
  testId?: string;
}

/**
 * `[Dashboard Redesign sprint, reference-image iteration]` A top,
 * pill-shaped nav bar - deliberately **not** promoted to `@ecclesia/ui-web`
 * yet and **not** the default (`AppShell`'s `navVariant` prop defaults to
 * `'sidebar'`) - the user explicitly chose "top pill nav for the
 * dashboard specifically", accepting that it looks different from every
 * other page's persistent sidebar, rather than a sitewide nav change. See
 * `DASHBOARD_REDESIGN_NOTES.md`'s "Reference image iteration" section.
 *
 * Colors are Ecclesia's own brand tokens (`theme.colors.brand.*`), not the
 * reference image's pink/lavender palette - the user's other explicit
 * choice was "keep the existing brand color, borrow the layout." Rounded
 * to `theme.radius.full` (a real design token, not an invented value) to
 * match the reference's pill shape within this design system's existing
 * "token-only" governance rule.
 */
export function PillNav({ items, linkAs: LinkAs, rightSlot, testId }: PillNavProps) {
  const theme = useTheme();

  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[4],
        flexWrap: 'wrap',
      }}
    >
      <div
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
          flexShrink: 0,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.text.primary,
        }}
      >
        <Icon name="church" size="md" color={theme.colors.surface.raised} />
      </div>

      <nav
        aria-label="Primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: theme.spacing[1],
          padding: theme.spacing[1],
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.surface.raised,
          border: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        {items.map((item) => (
          <LinkAs key={item.href} to={item.href} aria-current={item.active ? 'page' : undefined}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                padding: `${theme.spacing[2]}px ${theme.spacing[4]}px`,
                borderRadius: theme.radius.full,
                backgroundColor: item.active ? theme.colors.brand.default : 'transparent',
                color: item.active ? theme.colors.text.inverse : theme.colors.text.secondary,
                fontFamily: theme.fontFamily.base,
                fontSize: theme.typography.bodySmall.fontSize,
                fontWeight: item.active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name={item.icon} size="sm" color={item.active ? theme.colors.text.inverse : theme.colors.text.secondary} />
              {item.label}
            </span>
          </LinkAs>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>{rightSlot}</div>
    </div>
  );
}
