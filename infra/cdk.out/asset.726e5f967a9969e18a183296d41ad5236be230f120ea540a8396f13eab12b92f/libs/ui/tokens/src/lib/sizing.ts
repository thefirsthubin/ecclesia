/**
 * Sizing tokens (Design System v1.0 Part 6.4). `touchTarget.min` is the
 * accessibility floor every interactive component's minimum hit area
 * targets (Part 1.5): 44pt on iOS, 48dp on Android - the two platforms'
 * own accessibility guidelines disagree slightly, so this exports both
 * and lets `ui-native` pick per-`Platform.OS`, while `ui-web` uses the
 * larger (44) value as a single safe floor.
 */
export const touchTarget = {
  minIOS: 44,
  minAndroid: 48,
  /** The value `ui-web` uses - the larger of the two native floors. */
  minWeb: 44,
} as const;

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export const avatarSize = {
  sm: 24,
  md: 40,
  lg: 56,
} as const;

export type IconSizeToken = keyof typeof iconSize;
export type AvatarSizeToken = keyof typeof avatarSize;
