import { type InputHTMLAttributes } from 'react';
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
export declare function Checkbox({ label, error, helperText, indeterminate, testId, id, disabled, checked, ...rest }: CheckboxProps): import("react").JSX.Element;
//# sourceMappingURL=Checkbox.d.ts.map