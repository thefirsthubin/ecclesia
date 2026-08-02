import { Image, Text as RNText, View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import type { AvatarSizeToken } from '@ecclesia/ui-core';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSizeToken;
  testId?: string;
}

/** See `ui-web`'s `Avatar` for the initials/palette rationale - identical algorithm, RN primitives. */
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

export function Avatar({ name, src, size = 'md', testId }: AvatarProps) {
  const theme = useTheme();
  const diameter = theme.avatarSize[size];

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        accessible
        accessibilityLabel={name}
        testID={testId}
        style={{ width: diameter, height: diameter, borderRadius: theme.radius.full }}
      />
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={name}
      testID={testId}
      style={{
        width: diameter,
        height: diameter,
        borderRadius: theme.radius.full,
        backgroundColor: getPaletteColor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <RNText
        style={{
          fontFamily: theme.fontFamily.base,
          color: theme.colors.text.inverse,
          fontSize: Math.round(diameter * 0.4),
          fontWeight: '600',
        }}
      >
        {getInitials(name)}
      </RNText>
    </View>
  );
}
