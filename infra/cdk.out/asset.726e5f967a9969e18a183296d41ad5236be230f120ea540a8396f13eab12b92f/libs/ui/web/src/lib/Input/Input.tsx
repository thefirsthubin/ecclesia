import { useId, useState, type InputHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
  label: string;
  /** Field-level validation error (Design System v1.0 Part 7.3 - "inline, field-level validation... a clear, field-adjacent error message"). */
  error?: string;
  helperText?: string;
  testId?: string;
}

/**
 * Single-line text/number entry (Design System v1.0 Part 7.4). Every
 * field has a real, associated `<label>` (Part 7.3's accessibility rule -
 * "placeholder text is never the only label"), and an error message is
 * linked via `aria-describedby` so a screen-reader user hears it when the
 * field receives focus.
 */
export function Input({ label, error, helperText, testId, id, disabled, ...rest }: InputProps) {
  const theme = useTheme();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const helperId = `${inputId}-helper`;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.status.danger.strong
    : focused
      ? theme.colors.border.focus
      : theme.colors.border.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
      <label
        htmlFor={inputId}
        style={{
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.label.fontSize,
          fontWeight: theme.typography.label.fontWeight,
          letterSpacing: theme.typography.label.letterSpacing,
          color: theme.colors.text.secondary,
        }}
      >
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error || helperText ? helperId : undefined}
        data-testid={testId}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={{
          height: theme.touchTarget.minWeb,
          padding: `0 ${theme.spacing[3]}px`,
          borderRadius: theme.radius.sm,
          border: `1px solid ${borderColor}`,
          outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 1,
          backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
          color: theme.colors.text.primary,
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.body.fontSize,
          opacity: disabled ? theme.opacity.disabled : 1,
        }}
      />
      {(error || helperText) && (
        <span
          id={helperId}
          role={error ? 'alert' : undefined}
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.caption.fontSize,
            color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
          }}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
}
