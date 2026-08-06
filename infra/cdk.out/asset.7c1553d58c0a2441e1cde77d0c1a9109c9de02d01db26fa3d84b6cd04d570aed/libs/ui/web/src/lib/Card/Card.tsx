import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTheme } from '../ThemeProvider';
import { getBoxShadow } from '../utils';
import type { ElevationLevel, SpacingStep } from '@ecclesia/ui-core';

export interface CardProps {
  children: ReactNode;
  padding?: SpacingStep;
  elevation?: ElevationLevel;
  /** Design System v1.0 Part 7.2: makes the entire card surface a single tap target, e.g. a dashboard priority-zone item. */
  interactive?: boolean;
  onClick?: () => void;
  testId?: string;
}

/**
 * Groups related content (Design System v1.0 Part 7.2). `interactive`
 * cards are rendered as a real `<button>`-semantics element (`role`,
 * `tabIndex`, Enter/Space activation) rather than a `<div>` with a click
 * handler, so assistive technology announces them correctly (Part 7.2's
 * own accessibility note).
 */
export function Card({ children, padding = 4, elevation = 1, interactive = false, onClick, testId }: CardProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const hoverElevation: ElevationLevel = elevation === 2 ? 2 : ((elevation + 1) as ElevationLevel);
  const boxShadow = getBoxShadow(theme, interactive && hovered ? hoverElevation : elevation);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => interactive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-testid={testId}
      style={{
        padding: theme.spacing[padding],
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface.raised,
        border: `1px solid ${theme.colors.border.subtle}`,
        boxShadow,
        cursor: interactive ? 'pointer' : 'default',
        transition: `box-shadow ${theme.motion.duration.fast}ms`,
      }}
    >
      {children}
    </div>
  );
}
