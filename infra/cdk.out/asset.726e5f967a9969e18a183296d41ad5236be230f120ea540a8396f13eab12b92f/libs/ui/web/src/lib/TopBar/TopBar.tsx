import type { ReactNode } from 'react';
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
 */
export function TopBar({ left, right, onToggleSidebar, testId }: TopBarProps) {
  const theme = useTheme();

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
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: theme.spacing[2] }}
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
