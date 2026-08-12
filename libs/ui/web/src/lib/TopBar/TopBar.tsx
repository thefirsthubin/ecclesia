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
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>
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
            }}
          >
            <Icon name="menu" size="md" />
          </button>
        )}
        {left}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3] }}>{right}</div>
    </header>
  );
}
