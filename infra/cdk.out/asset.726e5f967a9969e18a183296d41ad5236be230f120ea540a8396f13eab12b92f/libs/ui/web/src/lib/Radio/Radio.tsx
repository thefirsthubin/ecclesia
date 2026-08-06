import { useId, type InputHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'type'> {
  label: string;
  testId?: string;
}

/**
 * A single option within a `RadioGroup` (Design System v1.0 Part 7.4).
 * Rarely used standalone - a lone radio button with no group has no valid
 * interaction model (nothing to select it *against*) - but exported on its
 * own for the rare case a screen composes a custom group layout `RadioGroup`
 * doesn't cover, same escape hatch `RadioGroup` itself documents.
 */
export function Radio({ label, testId, id, disabled, checked, ...rest }: RadioProps) {
  const theme = useTheme();
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  const dotColor = checked ? theme.colors.brand.default : 'transparent';
  const ringColor = checked ? theme.colors.brand.default : theme.colors.border.default;

  return (
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
          type="radio"
          id={fieldId}
          checked={checked}
          disabled={disabled}
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
            borderRadius: theme.radius.full,
            border: `1.5px solid ${ringColor}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ width: 10, height: 10, borderRadius: theme.radius.full, backgroundColor: dotColor }} />
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
  );
}
