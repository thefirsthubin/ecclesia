export interface SwitchProps {
    /** The setting this switch controls, e.g. "Email notifications" - always rendered as visible, associated text, never an icon-only toggle (Design System v1.0 Part 7.4). */
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    helperText?: string;
    testId?: string;
}
/**
 * An immediate-effect setting toggle (Design System v1.0 Part 7.4) -
 * deliberately distinct from `Checkbox`, which is a form-field selection
 * that only takes effect on submit. Real semantics come from
 * `role="switch"`+`aria-checked` on a native `<button>` (not a styled
 * `<input type="checkbox">` the way `Checkbox` uses - a switch's toggle
 * behavior is a button click, not a form checkbox check) - `aria-checked`
 * is what makes assistive tech announce "on"/"off" rather than
 * "checked"/"unchecked".
 */
export declare function Switch({ label, checked, onChange, disabled, helperText, testId }: SwitchProps): import("react").JSX.Element;
//# sourceMappingURL=Switch.d.ts.map