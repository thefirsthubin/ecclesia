import { Pressable, View, Text as RNText, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  helperText?: string;
  /** See `ui-web`'s `Checkbox` for the "select all" rationale. RN's `accessibilityState.checked` natively accepts `'mixed'`, so this maps directly - no ref/effect workaround needed here the way web requires. */
  indeterminate?: boolean;
  disabled?: boolean;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Checkbox`. No native RN checkbox
 * primitive exists, so this is a `Pressable` box + `Icon` rendered
 * conditionally, with `accessibilityRole="checkbox"` and
 * `accessibilityState.checked` (`true`/`false`/`'mixed'`) carrying the real
 * semantics for VoiceOver/TalkBack - the same "the artwork is decorative,
 * the accessibility props carry the meaning" split as web.
 */
export function Checkbox({ label, checked, onChange, error, helperText, indeterminate = false, disabled = false, testId }: CheckboxProps) {
  const theme = useTheme();

  const boxBackground = checked || indeterminate ? theme.colors.brand.default : 'transparent';
  const boxBorder = error
    ? theme.colors.status.danger.strong
    : checked || indeterminate
      ? theme.colors.brand.default
      : theme.colors.border.default;

  const handlePress = (_event: GestureResponderEvent) => {
    if (disabled) {
      return;
    }
    onChange(!checked);
  };

  return (
    <View style={{ gap: theme.spacing[1] }}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        testID={testId}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: indeterminate ? 'mixed' : checked, disabled }}
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
            borderRadius: theme.radius.sm,
            borderWidth: 1.5,
            borderColor: boxBorder,
            backgroundColor: boxBackground,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {indeterminate ? (
            <Icon name="minus" size="sm" color={theme.colors.text.inverse} />
          ) : checked ? (
            <Icon name="check" size="sm" color={theme.colors.text.inverse} />
          ) : null}
        </View>
        <RNText
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text.primary,
          }}
        >
          {label}
        </RNText>
      </Pressable>
      {(error || helperText) && (
        <RNText
          accessibilityRole={error ? 'alert' : undefined}
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.caption.fontSize,
            color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
          }}
        >
          {error ?? helperText}
        </RNText>
      )}
    </View>
  );
}
