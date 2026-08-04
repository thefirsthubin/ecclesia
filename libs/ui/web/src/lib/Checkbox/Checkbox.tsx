import { useEffect, useId, useRef, type InputHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'type'> {
  label: string;
  error?: string;
  helperText?: string;
  /** A third visual state for "some but not all of this group's children are checked" (e.g. a "select all" row) - set via `HTMLInputElement.indeterminate`, which has no JSX attribute equivalent, hence the ref-based effect below. Purely visual; does not change `checked`'s own on/off semantics. */
  indeterminate?: boolean;
  testId?: string;
}

/**
 * A binary form selection (Design System v1.0 Part 7.4) - distinct from
 * `Switch`, which is an immediate-effect setting toggle, not a form field
 * (Part 7.4's own distinction, reused here rather than re-litigated).
 * Renders a real `<input type="checkbox">` (never a styled `<div>`) so
 * native keyboard activation (Space), checked-state announcement, and
 * label association all come from the platform for free - the box
 * artwork on top is purely decorative (`aria-hidden`), the real input is
 * visually hidden but still in the accessibility tree and tab order.
 */
export function Checkbox({
  label,
  error,
  helperText,
  indeterminate = false,
  testId,
  id,
  disabled,
  checked,
  ...rest
}: CheckboxProps) {
  const theme = useTheme();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-helper`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const boxBackground = checked || indeterminate ? theme.colors.brand.default : 'transparent';
  const boxBorder = error
    ? theme.colors.status.danger.strong
    : checked || indeterminate
      ? theme.colors.brand.default
      : theme.colors.border.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
      <label
        htmlFor={fieldId}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing[2],
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? theme.opacity.disabled : 1,
        }}
      >
        <span style={{ position: 'relative', display: 'inline-flex', width: 20, height: 20 }}>
          <input
            {...rest}
            ref={inputRef}
            type="checkbox"
            id={fieldId}
            checked={checked}
            disabled={disabled}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || helperText ? helperId : undefined}
            data-testid={testId}
            style={{
              position: 'absolute',
              inset: 0,
              width: 20,
              height: 20,
              margin: 0,
              opacity: 0,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          />
          <span
            aria-hidden
            style={{
              width: 20,
              height: 20,
              borderRadius: theme.radius.sm,
              border: `1.5px solid ${boxBorder}`,
              backgroundColor: boxBackground,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            {indeterminate ? (
              <Icon name="minus" size="sm" color={theme.colors.text.inverse} />
            ) : checked ? (
              <Icon name="check" size="sm" color={theme.colors.text.inverse} />
            ) : null}
          </span>
        </span>
        <span
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text.primary,
          }}
        >
          {label}
        </span>
      </label>
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
