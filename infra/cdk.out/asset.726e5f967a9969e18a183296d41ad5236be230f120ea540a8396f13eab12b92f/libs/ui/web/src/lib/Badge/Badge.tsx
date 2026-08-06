import type { ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import type { StatusKey } from '@ecclesia/ui-core';

export interface BadgeProps {
  children: ReactNode;
  /** Design System v1.0 Part 5.10 - the five-color status system. Never repurposed for anything but status meaning (Part 5.10's "a status color is never reused for anything except status"). */
  status?: StatusKey;
  /** `subtle` (tinted background, Part 7.9 default) or `solid` (the status's strong fill, for higher emphasis). */
  variant?: 'subtle' | 'solid';
  testId?: string;
}

/**
 * A small inline status/count/label indicator (Design System v1.0 Part
 * 7.9). Note Part 7.9's own rule: a badge is never the *sole* means of
 * conveying urgency - callers are responsible for also reflecting urgency
 * in list position/ordering (Part 4.2's priority zone), this component
 * only renders the visual chip itself.
 */
export function Badge({ children, status = 'neutral', variant = 'subtle', testId }: BadgeProps) {
  const theme = useTheme();
  const statusColors = theme.colors.status[status];

  const background = variant === 'solid' ? statusColors.strong : statusColors.background;
  const color = variant === 'solid' ? theme.colors.text.inverse : statusColors.foreground;

  return (
    <span
      data-testid={testId}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: theme.spacing[1],
        padding: `${theme.spacing[1] / 2}px ${theme.spacing[2]}px`,
        borderRadius: theme.radius.full,
        backgroundColor: background,
        color,
        fontFamily: theme.fontFamily.base,
        fontSize: theme.typography.label.fontSize,
        fontWeight: theme.typography.label.fontWeight,
        letterSpacing: theme.typography.label.letterSpacing,
        lineHeight: `${theme.typography.label.lineHeight}px`,
      }}
    >
      {children}
    </span>
  );
}
