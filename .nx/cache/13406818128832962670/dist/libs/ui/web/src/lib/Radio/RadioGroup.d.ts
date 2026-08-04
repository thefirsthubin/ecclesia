export interface RadioOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface RadioGroupProps {
    /** The group's own visible label, rendered as a real `<legend>` inside a `<fieldset>` - a `RadioGroup` is one semantic form control, not N independent ones (Design System v1.0 Part 7.4). */
    label: string;
    name: string;
    options: RadioOption[];
    value: string | null;
    onChange: (value: string) => void;
    error?: string;
    helperText?: string;
    /** `column` (default, one option per row) or `row` (inline, for short option sets like Yes/No). */
    direction?: 'column' | 'row';
    testId?: string;
}
/**
 * A mutually-exclusive single-select from a small, fully-visible set
 * (Design System v1.0 Part 7.4) - the same "follow `Input`'s established
 * pattern" plan `UI_DESIGN_NOTES.md` set out for this component: label +
 * error/helper text, token-driven styling. `<fieldset>`/`<legend>` (not a
 * `<div>` + visually-styled heading) is what gives every `Radio` inside it
 * a correctly-announced group context for free.
 */
export declare function RadioGroup({ label, name, options, value, onChange, error, helperText, direction, testId }: RadioGroupProps): import("react").JSX.Element;
//# sourceMappingURL=RadioGroup.d.ts.map