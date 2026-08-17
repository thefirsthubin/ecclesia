import { useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { Text } from '../Text';
import { getBoxShadow } from '../utils';

export interface UserMenuProps {
  name: string;
  /** e.g. "Resident Pastor" - a human-readable label, not the raw `Role` enum value. */
  roleLabel: string;
  onLogout: () => void;
  testId?: string;
}

/**
 * Top-bar user menu (Design System §3.1's "User Menu") - identity display
 * plus logout (STEP 4). A disclosure button, same keyboard-operable
 * pattern as `NotificationBell`.
 *
 * `[Product Experience Sprint II, Phase 3 - AppShell pass]` Two fixes:
 * the popover's shadow was a hardcoded `rgba(0,0,0,0.15)` literal, not a
 * token - now `getBoxShadow(theme, 2)`, the same elevation-2 (modals/
 * toasts/dropdowns) value every other floating surface in the system
 * already uses. The trigger button also had no hover or focus-visible
 * styling at all (only `cursor: pointer`) - now gets the same quiet
 * `surface.default` hover fill and on-brand focus ring every other
 * interactive control in the shell uses.
 */
export function UserMenu({ name, roleLabel, onLogout, testId }: UserMenuProps) {
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
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[2],
          background: hovered ? theme.colors.surface.default : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: theme.spacing[1],
          borderRadius: theme.radius.sm,
          outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 2,
          transition: `background-color ${theme.motion.duration.fast}ms`,
        }}
      >
        <Avatar name={name} size="sm" />
        <Icon name="chevronDown" size="sm" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={`${name}'s account menu`}
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: theme.spacing[2],
            minWidth: 200,
            backgroundColor: theme.colors.surface.raised,
            border: `1px solid ${theme.colors.border.subtle}`,
            borderRadius: theme.radius.md,
            boxShadow: getBoxShadow(theme, 2),
            padding: theme.spacing[2],
            zIndex: theme.zIndex.overlay,
          }}
        >
          <div style={{ padding: theme.spacing[2], display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
            <Text variant="bodySmall">{name}</Text>
            <Text variant="caption" color={theme.colors.text.secondary}>
              {roleLabel}
            </Text>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: theme.spacing[2],
              borderRadius: theme.radius.sm,
              color: theme.colors.text.primary,
              font: 'inherit',
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
