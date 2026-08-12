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
 *
 * `[UX Design Implementation]` Final UX Design Specification §6 - default
 * `elevation` is now `0` (border only, no shadow). Shadow is reserved for
 * things that genuinely float above the content layer (modals, menus,
 * toasts - each of those renders its own elevation explicitly, not via
 * this default); an ordinary card sitting flat on the page background is
 * the common case, not the exception. An `interactive` card still gains a
 * shadow on hover (`elevation + 1`) as a real affordance signal that it's
 * about to be activated - only the *resting* state changed. The card's
 * boundary itself is `border.default` (Spec §12/§17's strengthened,
 * still-restrained tier for perceivable UI-component edges), not
 * `border.subtle` (reserved for decorative dividers only, e.g. `Divider`,
 * `Table` row separators).
 */
export function Card({ children, padding = 4, elevation = 0, interactive = false, onClick, testId }: CardProps) {
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
        border: `1px solid ${theme.colors.border.default}`,
        boxShadow,
        cursor: interactive ? 'pointer' : 'default',
        transition: `box-shadow ${theme.motion.duration.fast}ms`,
      }}
    >
      {children}
    </div>
  );
}
