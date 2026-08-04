import { type TextareaHTMLAttributes } from 'react';
export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'color'> {
    label: string;
    /** Field-level validation error (Design System v1.0 Part 7.3), same pattern as `Input`. */
    error?: string;
    helperText?: string;
    /** Visible text-area height in rows. Defaults to 4 - the same "roomy enough for a sentence or two, not a full page" default used across this codebase's free-text fields (e.g. pastoral care notes). */
    rows?: number;
    testId?: string;
}
/**
 * Multi-line text entry (Design System v1.0 Part 7.4's "TextArea" field
 * type). Deliberately `Input`'s own pattern reapplied, not a new
 * accessibility design: real `<label htmlFor>`, `aria-describedby` +
 * `role="alert"` on error - see `Input.tsx` for the full rationale, not
 * repeated here.
 */
export declare function TextArea({ label, error, helperText, rows, testId, id, disabled, ...rest }: TextAreaProps): import("react").JSX.Element;
//# sourceMappingURL=TextArea.d.ts.map