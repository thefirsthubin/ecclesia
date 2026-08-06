import * as LucideIcons from 'lucide-react-native';
import { ICON_REGISTRY, type IconName, type IconSizeToken } from '@ecclesia/ui-core';
import { useTheme } from '../ThemeProvider';

export interface IconProps {
  name: IconName;
  size?: IconSizeToken;
  color?: string;
  /** See `ui-web`'s `Icon` for the full accessibility rationale - identical rule here via RN's `accessibilityLabel`/`accessible` props instead of ARIA. */
  accessibilityLabel?: string;
}

/**
 * The React Native half of Ecclesia's single icon system (Design System
 * v1.0 Part 9) - same `ICON_REGISTRY` as `ui-web`'s `Icon`, rendering
 * through `lucide-react-native` instead of `lucide-react`. No screen
 * imports lucide directly on either platform.
 */
export function Icon({ name, size = 'md', color, accessibilityLabel }: IconProps) {
  const theme = useTheme();
  const lucideKey = ICON_REGISTRY[name];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see ui-web's Icon.tsx for why this boundary is intentional and contained.
  const LucideComponent = (LucideIcons as any)[lucideKey];

  if (!LucideComponent) {
    throw new Error(`Icon: no lucide-react-native export found for "${lucideKey}" (icon name "${name}")`);
  }

  return (
    <LucideComponent
      size={theme.iconSize[size]}
      color={color ?? theme.colors.text.secondary}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    />
  );
}
