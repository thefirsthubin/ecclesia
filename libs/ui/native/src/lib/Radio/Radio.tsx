import { Pressable, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface RadioProps {
  label: string;
  checked: boolean;
  onPress: () => void;
  disabled?: boolean;
  testId?: string;
}

/**
 * A single option within a `RadioGroup` - React Native equivalent of
 * `ui-web`'s `Radio`. No native RN radio primitive exists, so this is a
 * `Pressable` ring + dot, with `accessibilityRole="radio"` carrying the
 * real semantics (same "artwork is decorative, props carry meaning" split
 * used throughout this library).
 */
export function Radio({ label, checked, onPress, disabled = false, testId }: RadioProps) {
  const theme = useTheme();
  const dotColor = checked ? theme.colors.brand.default : 'transparent';
  const ringColor = checked ? theme.colors.brand.default : theme.colors.border.default;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      testID={testId}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      hitSlop={8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        opacity: disabled ? theme.opacity.disabled : 1,
        minHeight: theme.touchTarget.minIOS,
      }}
    >
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: theme.radius.full,
          borderWidth: 1.5,
          borderColor: ringColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: 10, height: 10, borderRadius: theme.radius.full, backgroundColor: dotColor }} />
      </View>
      <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>
        {label}
      </RNText>
    </Pressable>
  );
}
