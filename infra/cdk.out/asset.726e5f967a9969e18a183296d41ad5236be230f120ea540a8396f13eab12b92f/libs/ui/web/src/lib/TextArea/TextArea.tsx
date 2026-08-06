import { useId, useState, type TextareaHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'> {
  label: string;
  /** Field-level validation error (Design System v1.0 Part 7.3), same pattern as `Input`. */
  error?: string;
  helperText?: string;
  /** Visible text-area height in rows. Defaults to 4 - the same "roomy enough for a sentence or two, not a full page" default used across this codebase's free-text fields (e.g. pastoral care notes). */
  rows?: number;
  testId?: string;
}

/**
 * Multi-line text entry (Design System v1.0 Part 7.4's "TextArea" field
 * type). Deliberately `Input`'s own pattern reapplied, not a new
 * accessibility design: real `<label htmlFor>`, `aria-describedby` +
 * `role="alert"` on error - see `Input.tsx` for the full rationale, not
 * repeated here.
 */
export function TextArea({ label, error, helperText, rows = 4, testId, id, disabled, ...rest }: TextAreaProps) {
  const theme = useTheme();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-helper`;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.status.danger.strong
    : focused
      ? theme.colors.border.focus
      : theme.colors.border.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
      <label
        htmlFor={fieldId}
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
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
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
          padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
          borderRadius: theme.radius.sm,
          border: `1px solid ${borderColor}`,
          outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 1,
          backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
          color: theme.colors.text.primary,
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.body.fontSize,
          opacity: disabled ? theme.opacity.disabled : 1,
          resize: 'vertical',
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
