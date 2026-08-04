import { View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Radio } from './Radio';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  direction?: 'column' | 'row';
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `RadioGroup`. RN has no
 * `<fieldset>`/`<legend>` concept - `accessibilityRole="radiogroup"` on the
 * wrapping `View` is the platform's own analogue, with the visible label
 * `Text` linked via `accessibilityLabelledBy`/`nativeID` where supported
 * and duplicated into the group's own `accessibilityLabel` as a fallback,
 * the same belt-and-suspenders approach `Input`/`TextArea` use.
 */
export function RadioGroup({ label, options, value, onChange, error, helperText, direction = 'column', testId }: RadioGroupProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing[2] }} testID={testId} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <RNText
        style={{
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.label.fontSize,
          fontWeight: '600',
          letterSpacing: theme.typography.label.letterSpacing,
          color: theme.colors.text.secondary,
        }}
      >
        {label}
      </RNText>
      <View style={{ flexDirection: direction === 'row' ? 'row' : 'column', gap: direction === 'row' ? theme.spacing[4] : theme.spacing[2] }}>
        {options.map((option) => (
          <Radio
            key={option.value}
            label={option.label}
            checked={value === option.value}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
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
