import { useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { Text } from '../Text';

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
 */
export function UserMenu({ name, roleLabel, onLogout, testId }: UserMenuProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }} data-testid={testId}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[2],
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: theme.spacing[1],
          borderRadius: theme.radius.sm,
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
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
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
