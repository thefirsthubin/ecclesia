export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface SelectProps {
    label: string;
    options: SelectOption[];
    value: string | null;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    helperText?: string;
    disabled?: boolean;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Select`. RN has no native
 * `<select>` element, so this composes two components already in this
 * library rather than inventing a new overlay strategy: a `Pressable`
 * trigger styled to match `Input`, and this library's own `Modal`
 * (`variant="dialog"`) presenting the option list - `Modal` already proved
 * out the portal/focus-trap/dismissal behavior this needs, so `Select`
 * reuses it instead of re-solving the same problem.
 */
export declare function Select({ label, options, value, onChange, placeholder, error, helperText, disabled, testId }: SelectProps): import("react").JSX.Element;
//# sourceMappingURL=Select.d.ts.map