import { type SelectHTMLAttributes } from 'react';
export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'color'> {
    label: string;
    options: SelectOption[];
    /** Rendered as a disabled, unselectable first option - "Select a Ministry", not a real value (Design System v1.0 Part 7.4 - a placeholder is never itself a valid answer). */
    placeholder?: string;
    error?: string;
    helperText?: string;
    testId?: string;
}
/**
 * Labeled dropdown selection from a closed set of options (Design System
 * v1.0 Part 7.4) - `Input`'s established pattern reapplied
 * (`UI_DESIGN_NOTES.md`'s own plan for this component). Renders a real
 * `<select>` (never a custom listbox built from `<div>`s) so native
 * keyboard navigation, type-ahead, and mobile-native picker UI all come
 * from the platform; the chevron icon on top is decorative
 * (`pointerEvents: none`), the real interactive surface is the `<select>`
 * itself, styled to match `Input`'s visual language via `appearance: none`.
 */
export declare function Select({ label, options, placeholder, error, helperText, testId, id, disabled, ...rest }: SelectProps): import("react").JSX.Element;
//# sourceMappingURL=Select.d.ts.map