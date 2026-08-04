export interface RadioOption {
    value: string;
    label: string;
    disabled?: boolean;
}
export interface RadioGroupProps {
    label: string;
    options: RadioOption[];
    value: string | null;
    onChange: (value: string) => void;
    error?: string;
    helperText?: string;
    direction?: 'column' | 'row';
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `RadioGroup`. RN has no
 * `<fieldset>`/`<legend>` concept - `accessibilityRole="radiogroup"` on the
 * wrapping `View` is the platform's own analogue, with the visible label
 * `Text` linked via `accessibilityLabelledBy`/`nativeID` where supported
 * and duplicated into the group's own `accessibilityLabel` as a fallback,
 * the same belt-and-suspenders approach `Input`/`TextArea` use.
 */
export declare function RadioGroup({ label, options, value, onChange, error, helperText, direction, testId }: RadioGroupProps): import("react").JSX.Element;
//# sourceMappingURL=RadioGroup.d.ts.map