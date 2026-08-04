import { type ReactNode } from 'react';
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
export declare function Modal({ isOpen, onClose, title, children, variant, dismissible, footer, testId }: ModalProps): import("react").ReactPortal | null;
//# sourceMappingURL=Modal.d.ts.map