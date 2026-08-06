import * as LucideIcons from 'lucide-react';
import { ICON_REGISTRY, type IconName } from '@ecclesia/ui-core';
import { useTheme } from '../ThemeProvider';
import type { IconSizeToken } from '@ecclesia/ui-core';

export interface IconProps {
  /** One of the curated names in `ICON_REGISTRY` (`@ecclesia/ui-core`) - never a raw lucide component name (Design System v1.0 Part 9). */
  name: IconName;
  size?: IconSizeToken;
  /** Defaults to the current theme's `text.secondary` - icons are rarely the loudest thing on screen (Part 5.8). */
  color?: string;
  /** Required when the icon conveys meaning with no adjacent text label (Part 1.5/Part 7.9 - "icon-only buttons always carry an accessibilityLabel"). Omit for purely decorative icons. */
  'aria-label'?: string;
}

/**
 * The single entry point to Ecclesia's icon set (Design System v1.0 Part
 * 9). No screen or component outside this file imports `lucide-react`
 * directly - see `@ecclesia/ui-core`'s `ICON_REGISTRY` for the full
 * rationale and the curated name list.
 */
export function Icon({ name, size = 'md', color, 'aria-label': ariaLabel }: IconProps) {
  const theme = useTheme();
  const lucideKey = ICON_REGISTRY[name];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- lucide-react's own type exports don't offer a clean "look up by string key" signature; this is the one, intentionally-contained boundary where that's necessary.
  const LucideComponent = (LucideIcons as any)[lucideKey];

  if (!LucideComponent) {
    // Fails loudly in development rather than silently rendering nothing -
    // an icon name/lucide-key mismatch is a programming error in this
    // package, not a runtime data condition a consuming screen should
    // need to guard against.
    throw new Error(`Icon: no lucide export found for "${lucideKey}" (icon name "${name}")`);
  }

  return (
    <LucideComponent
      size={theme.iconSize[size]}
      color={color ?? theme.colors.text.secondary}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    />
  );
}
