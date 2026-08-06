import { useTheme } from '../ThemeProvider';
import type { AvatarSizeToken } from '@ecclesia/ui-core';

export interface AvatarProps {
  /** The Person's full name - used for the accessible label and, when `src` is absent, the initials fallback. */
  name: string;
  src?: string;
  size?: AvatarSizeToken;
  testId?: string;
}

/**
 * A deliberately small, accessible palette for the initials fallback -
 * distinct from the five-color status system (Part 5.10) so an avatar
 * color is never mistaken for a status signal (Design System v1.0 Part
 * 5.9's illustration/iconography restraint applies here too).
 */
const INITIALS_PALETTE = ['#1B7A6E', '#4C9A6A', '#1554A0', '#8A5A00', '#6B4FA1', '#B3261E'] as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getPaletteColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return INITIALS_PALETTE[hash % INITIALS_PALETTE.length];
}

/**
 * Represents a Person compactly (Design System v1.0 Part 7.11 -
 * reinforcing "Relationships Matter", Part 1.2). Always renders an
 * accessible name, whether via `<img alt>` or the initials fallback's
 * `aria-label` - "an avatar is never the sole identifier" without a
 * text-accessible name attached to it.
 */
export function Avatar({ name, src, size = 'md', testId }: AvatarProps) {
  const theme = useTheme();
  const diameter = theme.avatarSize[size];

  const commonStyle = {
    width: diameter,
    height: diameter,
    borderRadius: theme.radius.full,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden' as const,
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        data-testid={testId}
        style={{ ...commonStyle, objectFit: 'cover' as const }}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      data-testid={testId}
      style={{
        ...commonStyle,
        backgroundColor: getPaletteColor(name),
        color: theme.colors.text.inverse,
        fontFamily: theme.fontFamily.base,
        fontSize: Math.round(diameter * 0.4),
        fontWeight: 600,
      }}
    >
      {getInitials(name)}
    </span>
  );
}
