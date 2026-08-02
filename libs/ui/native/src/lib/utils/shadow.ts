import { Platform } from 'react-native';
import type { ElevationLevel, Theme } from '@ecclesia/ui-core';

/**
 * The React Native translation of `ui-tokens`' platform-neutral elevation
 * data (see `ui-web`'s `getBoxShadow` for the web equivalent - same
 * source, two native renderings). iOS uses the `shadow*` style props;
 * Android has no shadow-blur concept and instead uses the single
 * `elevation` prop, approximated here from the same blur value so a
 * given `ElevationLevel` reads as "about as elevated" on both platforms
 * even though neither implementation is a direct translation of the
 * other.
 */
export function getElevationStyle(theme: Theme, level: ElevationLevel) {
  const e = theme.elevation[level];
  if (e.opacity === 0) {
    return Platform.select({ android: { elevation: 0 }, default: {} });
  }
  return Platform.select({
    android: { elevation: Math.max(1, Math.round(e.blur / 3)) },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: e.offsetX, height: e.offsetY },
      shadowOpacity: e.opacity,
      shadowRadius: e.blur / 2,
    },
  });
}
