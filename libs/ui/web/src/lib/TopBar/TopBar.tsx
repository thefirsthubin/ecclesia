import { useState, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface TopBarProps {
  /** Rendered on the left, after the (optional) sidebar toggle - typically `<Breadcrumbs>`. */
  left?: ReactNode;
  /** Rendered on the right - typically `<NotificationBell>` + `<UserMenu>`. */
  right?: ReactNode;
  /** Present only below the Design System §6.11 tablet breakpoint, where the sidebar becomes a toggled overlay instead of always-visible. */
  onToggleSidebar?: () => void;
  testId?: string;
}

/**
 * Web Admin's top navigation bar (Design System §3.1's "Top Navigation" +
 * "Page Header" + "Responsive Collapse"). A `<header>` landmark.
 *
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 2
 * shell verification) - the sidebar-toggle button now gets the same
 * on-brand `border.focus` outline `Button` already uses, closing the
 * same shell inconsistency `Sidebar`'s nav links were fixed for.
 *
 * `[Product Experience Sprint II, Phase 5]` A real overflow bug, found on
 * `PersonDetailPage` specifically (its `Dashboard > People > Person`
 * breadcrumb trail is the longest in the app) - the same missing-
 * `minWidth: 0` class of bug this sprint already fixed five other places
 * (`KpiCard`, `LineChart`, `RecentActivityTimeline`, `main`'s own flex
 * item, `PersonDetailPage`'s own contact rows). The left slot (toggle +
 * breadcrumbs, genuinely variable-length content) now gets `minWidth: 0`
 * so it can shrink; the right slot (search/notifications/user menu -
 * fixed controls, never the thing that should compress) gets
 * `flexShrink: 0` instead, so it keeps its full size and the left slot
 * absorbs the pressure - the same "one flexible sibling, one protected
 * one" split every other fix this sprint used.
 */
export function TopBar({ left, right, onToggleSidebar, testId }: TopBarProps) {
  const theme = useTheme();
  const [toggleFocused, setToggleFocused] = useState(false);

  return (
    <header
      data-testid={testId}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing[4],
        padding: `${theme.spacing[3]}px ${theme.spacing[4]}px`,
        borderBottom: `1px solid ${theme.colors.border.subtle}`,
        backgroundColor: theme.colors.surface.raised,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], minWidth: 0 }}>
        {onToggleSidebar && (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={onToggleSidebar}
            onFocus={() => setToggleFocused(true)}
            onBlur={() => setToggleFocused(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing[2],
              borderRadius: theme.radius.sm,
              outline: toggleFocused ? `2px solid ${theme.colors.border.focus}` : 'none',
              outlineOffset: 1,
              flexShrink: 0,
            }}
          >
            <Icon name="menu" size="md" />
          </button>
        )}
        {left}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], flexShrink: 0 }}>{right}</div>
    </header>
  );
}
