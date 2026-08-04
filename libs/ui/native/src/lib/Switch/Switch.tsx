import { Switch as RNSwitch, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  helperText?: string;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Switch`, built on RN's own
 * `Switch` primitive (the same "use the platform's real control rather
 * than reimplement it" choice `Modal` made for its portal/overlay) -
 * `Switch` is one of the few form controls RN ships natively with correct
 * platform-conventional visuals and built-in `accessibilityRole="switch"`
 * behavior on both iOS and Android.
 */
export function Switch({ label, checked, onChange, disabled = false, helperText, testId }: SwitchProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing[1] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
        <RNSwitch
          value={checked}
          onValueChange={onChange}
          disabled={disabled}
          testID={testId}
          accessibilityLabel={label}
          trackColor={{ false: theme.colors.border.default, true: theme.colors.brand.default }}
          thumbColor={theme.colors.surface.raised}
        />
        <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>
          {label}
        </RNText>
      </View>
      {helperText && (
        <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }}>
          {helperText}
        </RNText>
      )}
    </View>
  );
}
