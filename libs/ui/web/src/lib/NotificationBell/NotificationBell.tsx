import { useState, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { getBoxShadow } from '../utils';

export interface NotificationBellProps {
  count: number;
  /** Rendered inside the popover when open - the caller owns the actual notification list content/data. */
  children: ReactNode;
  testId?: string;
}

/**
 * Top-bar notification area (Design System §3.1's "Notification Area").
 * A disclosure button (`aria-expanded`/`aria-haspopup`) rather than a
 * hover-only flyout, so it's fully keyboard-operable (STEP 8).
 *
 * `[Product Experience Sprint II, Phase 3 - AppShell pass]` Same two
 * fixes as `UserMenu`'s own doc comment: `getBoxShadow(theme, 2)`
 * replaces a hardcoded shadow literal, and the trigger gets a real
 * hover/focus-visible state it previously had none of.
 */
export function NotificationBell({ count, children, testId }: NotificationBellProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative' }} data-testid={testId}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: 'relative',
          background: hovered ? theme.colors.surface.default : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: theme.spacing[2],
          borderRadius: theme.radius.sm,
          outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 2,
          transition: `background-color ${theme.motion.duration.fast}ms`,
        }}
      >
        <Icon name="bell" size="md" />
        {count > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.status.danger.strong,
              color: theme.colors.text.inverse,
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: theme.spacing[2],
            width: 320,
            maxHeight: 400,
            overflowY: 'auto',
            backgroundColor: theme.colors.surface.raised,
            border: `1px solid ${theme.colors.border.subtle}`,
            borderRadius: theme.radius.md,
            boxShadow: getBoxShadow(theme, 2),
            padding: theme.spacing[3],
            zIndex: theme.zIndex.overlay,
          }}
        >
          {count === 0 ? <Text variant="bodySmall" color={theme.colors.text.secondary}>No new notifications.</Text> : children}
        </div>
      )}
    </div>
  );
}
