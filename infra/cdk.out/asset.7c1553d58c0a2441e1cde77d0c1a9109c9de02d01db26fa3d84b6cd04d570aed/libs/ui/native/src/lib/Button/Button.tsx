import { Pressable, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Spinner } from '../Spinner';
import { Text } from '../Text';
import type { ActionVariant, IconName, Size } from '@ecclesia/ui-core';

export interface ButtonProps {
  children?: string;
  variant?: ActionVariant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  accessibilityLabel?: string;
  onPress?: (event: GestureResponderEvent) => void;
  testId?: string;
}

const SIZE_HEIGHT: Record<Size, number> = { sm: 36, md: 44, lg: 52 };
const SIZE_PADDING_X: Record<Size, number> = { sm: 12, md: 16, lg: 20 };

/**
 * React Native equivalent of `ui-web`'s `Button` - same variant/size/
 * loading/icon API, `Pressable` instead of `<button>`. Height defaults
 * are RN's own touch-target floor (44pt iOS / 48dp Android,
 * `theme.touchTarget.minIOS`/`minAndroid` - Design System v1.0 Part 1.5),
 * not `ui-web`'s 40px default, since mobile is a stricter accessibility
 * floor by platform convention.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  accessibilityLabel,
  onPress,
  testId,
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette = {
    primary: { background: theme.colors.brand.default, backgroundPressed: theme.colors.brand.active, text: theme.colors.text.inverse, border: 'transparent' },
    secondary: { background: 'transparent', backgroundPressed: theme.colors.border.subtle, text: theme.colors.text.primary, border: theme.colors.border.default },
    tertiary: { background: 'transparent', backgroundPressed: theme.colors.border.subtle, text: theme.colors.brand.default, border: 'transparent' },
    danger: { background: theme.colors.status.danger.strong, backgroundPressed: theme.colors.status.danger.strong, text: theme.colors.text.inverse, border: 'transparent' },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      testID={testId}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        height: Math.max(SIZE_HEIGHT[size], theme.touchTarget.minIOS),
        minWidth: theme.touchTarget.minIOS,
        paddingHorizontal: SIZE_PADDING_X[size],
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderColor: palette.border,
        backgroundColor: pressed && !isDisabled ? palette.backgroundPressed : palette.background,
        opacity: disabled && !loading ? theme.opacity.disabled : 1,
      })}
    >
      {loading ? (
        <Spinner size="sm" color={palette.text} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size="sm" color={palette.text} />}
          {children && (
            <Text variant="body" color={palette.text}>
              {children}
            </Text>
          )}
          {iconRight && <Icon name={iconRight} size="sm" color={palette.text} />}
        </>
      )}
    </Pressable>
  );
}
