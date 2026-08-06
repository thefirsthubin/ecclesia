import { useId } from 'react';
import { useTheme } from '../ThemeProvider';
import { Radio } from './Radio';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** The group's own visible label, rendered as a real `<legend>` inside a `<fieldset>` - a `RadioGroup` is one semantic form control, not N independent ones (Design System v1.0 Part 7.4). */
  label: string;
  name: string;
  options: RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  /** `column` (default, one option per row) or `row` (inline, for short option sets like Yes/No). */
  direction?: 'column' | 'row';
  testId?: string;
}

/**
 * A mutually-exclusive single-select from a small, fully-visible set
 * (Design System v1.0 Part 7.4) - the same "follow `Input`'s established
 * pattern" plan `UI_DESIGN_NOTES.md` set out for this component: label +
 * error/helper text, token-driven styling. `<fieldset>`/`<legend>` (not a
 * `<div>` + visually-styled heading) is what gives every `Radio` inside it
 * a correctly-announced group context for free.
 */
export function RadioGroup({ label, name, options, value, onChange, error, helperText, direction = 'column', testId }: RadioGroupProps) {
  const theme = useTheme();
  const generatedId = useId();
  const helperId = `${generatedId}-helper`;

  return (
    <fieldset
      style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}
      aria-describedby={error || helperText ? helperId : undefined}
      aria-invalid={Boolean(error) || undefined}
      data-testid={testId}
    >
      <legend
        style={{
          padding: 0,
          marginBottom: theme.spacing[1],
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.label.fontSize,
          fontWeight: theme.typography.label.fontWeight,
          letterSpacing: theme.typography.label.letterSpacing,
          color: theme.colors.text.secondary,
        }}
      >
        {label}
      </legend>
      <div style={{ display: 'flex', flexDirection: direction, gap: direction === 'row' ? theme.spacing[4] : theme.spacing[2] }}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            label={option.label}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
        ))}
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
    </fieldset>
  );
}
