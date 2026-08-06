import { useState } from 'react';
import { TextInput, View, Text as RNText, type TextInputProps } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helperText?: string;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Input`. RN's `TextInput` has no
 * native `<label>` association - the label is rendered as sibling text
 * and linked via `accessibilityLabelledBy`/`nativeID` where the platform
 * supports it, falling back to `accessibilityLabel` mirroring the visible
 * label text so screen readers always announce it regardless of RN
 * version/platform quirks in `labelledBy` support.
 */
export function Input({ label, error, helperText, testId, editable = true, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.status.danger.strong
    : focused
      ? theme.colors.border.focus
      : theme.colors.border.default;

  return (
    <View style={{ gap: theme.spacing[1] }}>
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
      <TextInput
        {...rest}
        editable={editable}
        testID={testId}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !editable }}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        placeholderTextColor={theme.colors.text.disabled}
        style={{
          height: theme.touchTarget.minIOS,
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.sm,
          borderWidth: focused ? 2 : 1,
          borderColor,
          backgroundColor: editable ? theme.colors.surface.raised : theme.colors.surface.default,
          color: theme.colors.text.primary,
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.body.fontSize,
          opacity: editable ? 1 : theme.opacity.disabled,
        }}
      />
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
