import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../ThemeProvider';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Labels the dialog for assistive technology (Design System v1.0 Part
   * 7.8: "labelled by its heading") - always rendered as a real heading
   * inside the modal, not merely an `aria-label` string. */
  title: string;
  children: ReactNode;
  /** `modal` (elevation.2, up to `radius.lg`) vs `dialog` (smaller,
   * centered, no scroll) - Part 7.8's two web variants. `bottom-sheet` is
   * Mobile's own equivalent, not this component's concern. */
  variant?: 'modal' | 'dialog';
  /** A destructive-action dialog "requires an explicit button press,
   * never a dismiss-by-accident path" (Part 7.8) - set `false` to disable
   * `Esc`/scrim-click dismissal, leaving only `footer`'s own explicit
   * buttons able to close it. Defaults to `true` (non-destructive). */
  dismissible?: boolean;
  /** Action buttons, typically `Button`s - rendered below `children`. */
  footer?: ReactNode;
  testId?: string;
}

/**
 * A focused sub-task or confirmation that must complete or cancel before
 * returning to the parent screen (Design System v1.0 Part 7.8). Portaled
 * to `document.body` (the "portal/overlay strategy" `UI_DESIGN_NOTES.md`'s
 * "Base components - deferred" section flagged this component as needing),
 * using the already-exported-but-previously-unused `zIndex.overlay`/
 * `zIndex.modal` tokens.
 *
 * **Focus management** (Part 7.8's own behavior spec): on open, the
 * previously-focused element is remembered and the dialog itself receives
 * focus; `Tab`/`Shift+Tab` are trapped within the dialog's focusable
 * elements (a minimal, dependency-free trap - cycling from the last
 * focusable element back to the first and vice versa, not a full
 * `inert`-based implementation, since none of this codebase's other
 * components have needed one yet); on close, focus returns to whatever
 * triggered the modal. **Never stack a second modal on top of an open
 * one** (Part 7.8's own usage rule) - this component does not defend
 * against that programmatically (no global "a modal is already open"
 * registry exists anywhere in this codebase), it is a caller discipline
 * rule, the same way `Button`'s "exactly one primary variant per screen"
 * rule is documented but not structurally enforced.
 */
export function Modal({ isOpen, onClose, title, children, variant = 'modal', dismissible = true, footer, testId }: ModalProps) {
  const theme = useTheme();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      previouslyFocusedElement.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const getFocusableElements = (): HTMLElement[] => {
    if (!dialogRef.current) {
      return [];
    }
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && dismissible) {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const isDialog = variant === 'dialog';

  return createPortal(
    <div
      data-testid={testId ? `${testId}-scrim` : undefined}
      onClick={dismissible ? onClose : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: theme.zIndex.overlay,
        backgroundColor: theme.colors.surface.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[4],
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={testId ? `${testId}-title` : undefined}
        tabIndex={-1}
        data-testid={testId}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        style={{
          zIndex: theme.zIndex.modal,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing[4],
          width: isDialog ? 400 : 560,
          maxWidth: '100%',
          maxHeight: isDialog ? undefined : '85vh',
          overflowY: isDialog ? undefined : 'auto',
          padding: theme.spacing[5],
          borderRadius: isDialog ? theme.radius.md : theme.radius.lg,
          backgroundColor: theme.colors.surface.raised,
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.24)',
        }}
      >
        <h2
          id={testId ? `${testId}-title` : undefined}
          style={{
            margin: 0,
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.heading3.fontSize,
            fontWeight: theme.typography.heading3.fontWeight,
            color: theme.colors.text.primary,
          }}
        >
          {title}
        </h2>
        <div style={{ color: theme.colors.text.primary }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: theme.spacing[2] }}>{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}
