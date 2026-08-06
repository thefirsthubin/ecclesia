import { useId, useState, type SelectHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'color'> {
  label: string;
  options: SelectOption[];
  /** Rendered as a disabled, unselectable first option - "Select a Ministry", not a real value (Design System v1.0 Part 7.4 - a placeholder is never itself a valid answer). */
  placeholder?: string;
  error?: string;
  helperText?: string;
  testId?: string;
}

/**
 * Labeled dropdown selection from a closed set of options (Design System
 * v1.0 Part 7.4) - `Input`'s established pattern reapplied
 * (`UI_DESIGN_NOTES.md`'s own plan for this component). Renders a real
 * `<select>` (never a custom listbox built from `<div>`s) so native
 * keyboard navigation, type-ahead, and mobile-native picker UI all come
 * from the platform; the chevron icon on top is decorative
 * (`pointerEvents: none`), the real interactive surface is the `<select>`
 * itself, styled to match `Input`'s visual language via `appearance: none`.
 */
export function Select({ label, options, placeholder, error, helperText, testId, id, disabled, ...rest }: SelectProps) {
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
      <div style={{ position: 'relative' }}>
        <select
          {...rest}
          id={fieldId}
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
            width: '100%',
            height: theme.touchTarget.minWeb,
            padding: `0 ${theme.spacing[8]}px 0 ${theme.spacing[3]}px`,
            borderRadius: theme.radius.sm,
            border: `1px solid ${borderColor}`,
            outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
            outlineOffset: 1,
            backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
            color: theme.colors.text.primary,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.body.fontSize,
            opacity: disabled ? theme.opacity.disabled : 1,
            appearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {placeholder && (
            <option value="" disabled hidden={rest.value !== undefined && rest.value !== ''}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: theme.spacing[3],
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <Icon name="chevronDown" size="sm" />
        </span>
      </div>
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
