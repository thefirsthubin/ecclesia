import { type InputHTMLAttributes } from 'react';
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'> {
    label: string;
    /** Field-level validation error (Design System v1.0 Part 7.3 - "inline, field-level validation... a clear, field-adjacent error message"). */
    error?: string;
    helperText?: string;
    testId?: string;
}
/**
 * Single-line text/number entry (Design System v1.0 Part 7.4). Every
 * field has a real, associated `<label>` (Part 7.3's accessibility rule -
 * "placeholder text is never the only label"), and an error message is
 * linked via `aria-describedby` so a screen-reader user hears it when the
 * field receives focus.
 */
export declare function Input({ label, error, helperText, testId, id, disabled, ...rest }: InputProps): import("react").JSX.Element;
//# sourceMappingURL=Input.d.ts.map