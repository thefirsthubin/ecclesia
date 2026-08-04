import { useState } from 'react';
import { TextInput, View, Text as RNText, type TextInputProps } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface TextAreaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
  label: string;
  error?: string;
  helperText?: string;
  /** Approximate visible height in text lines - RN has no `rows` concept, this drives a `minHeight` computed from line height. Defaults to 4. */
  rows?: number;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `TextArea` - `Input`'s pattern
 * reapplied with `multiline` forced on and `textAlignVertical="top"` so
 * text starts at the top of the field like a real multi-line field rather
 * than vertically centering a single line (RN's default for multiline
 * TextInput on Android).
 */
export function TextArea({ label, error, helperText, rows = 4, testId, editable = true, ...rest }: TextAreaProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.status.danger.strong
    : focused
      ? theme.colors.border.focus
      : theme.colors.border.default;

  const lineHeight = theme.typography.body.lineHeight;

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
        multiline
        textAlignVertical="top"
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
          minHeight: lineHeight * rows + theme.spacing[3],
          paddingHorizontal: theme.spacing[3],
          paddingVertical: theme.spacing[2],
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
