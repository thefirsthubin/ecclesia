import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Spinner } from '../Spinner';
import type { ActionVariant, IconName, Size } from '@ecclesia/ui-core';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  children?: ReactNode;
  variant?: ActionVariant;
  size?: Size;
  loading?: boolean;
  iconLeft?: IconName;
  iconRight?: IconName;
  /** Required when `children` is empty (icon-only button) - Design System v1.0 Part 7.1. */
  accessibilityLabel?: string;
  testId?: string;
}

const SIZE_HEIGHT: Record<Size, number> = { sm: 32, md: 40, lg: 48 };
const SIZE_PADDING_X: Record<Size, number> = { sm: 12, md: 16, lg: 20 };

/**
 * The primary action trigger (Design System v1.0 Part 7.1). Exactly one
 * `variant="primary"` per screen is a *usage* rule for consumers, not
 * something this component can enforce structurally - documented in
 * `../../../UI_DESIGN_NOTES.md`.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  accessibilityLabel,
  testId,
  onClick,
  type = 'button',
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const [interactionState, setInteractionState] = useState<'idle' | 'hover' | 'active' | 'focus'>('idle');
  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      background: theme.colors.brand.default,
      backgroundHover: theme.colors.brand.hover,
      backgroundActive: theme.colors.brand.active,
      text: theme.colors.text.inverse,
      border: 'transparent',
    },
    secondary: {
      background: 'transparent',
      backgroundHover: theme.colors.surface.raised,
      backgroundActive: theme.colors.border.subtle,
      text: theme.colors.text.primary,
      border: theme.colors.border.default,
    },
    tertiary: {
      background: 'transparent',
      backgroundHover: theme.colors.surface.raised,
      backgroundActive: theme.colors.border.subtle,
      text: theme.colors.brand.default,
      border: 'transparent',
    },
    danger: {
      background: theme.colors.status.danger.strong,
      backgroundHover: theme.colors.status.danger.strong,
      backgroundActive: theme.colors.status.danger.strong,
      text: theme.colors.text.inverse,
      border: 'transparent',
    },
  }[variant];

  const background =
    interactionState === 'active' && !isDisabled
      ? palette.backgroundActive
      : interactionState === 'hover' && !isDisabled
        ? palette.backgroundHover
        : palette.background;

  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      onMouseEnter={() => setInteractionState('hover')}
      onMouseLeave={() => setInteractionState('idle')}
      onMouseDown={() => setInteractionState('active')}
      onMouseUp={() => setInteractionState('hover')}
      onFocus={() => setInteractionState((s) => (s === 'idle' ? 'focus' : s))}
      onBlur={() => setInteractionState('idle')}
      aria-label={accessibilityLabel}
      aria-busy={loading || undefined}
      data-testid={testId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing[2],
        height: SIZE_HEIGHT[size],
        minWidth: theme.touchTarget.minWeb,
        padding: `0 ${SIZE_PADDING_X[size]}px`,
        borderRadius: theme.radius.sm,
        border: `1px solid ${palette.border}`,
        background,
        color: palette.text,
        fontFamily: theme.fontFamily.base,
        fontSize: theme.typography.body.fontSize,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? theme.opacity.disabled : 1,
        outline: interactionState === 'focus' ? `2px solid ${theme.colors.border.focus}` : 'none',
        outlineOffset: 2,
        transition: `background-color ${theme.motion.duration.fast}ms`,
      }}
    >
      {loading ? (
        <Spinner size="sm" color={palette.text} />
      ) : (
        <>
          {iconLeft && <Icon name={iconLeft} size="sm" color={palette.text} />}
          {children}
          {iconRight && <Icon name={iconRight} size="sm" color={palette.text} />}
        </>
      )}
    </button>
  );
}
