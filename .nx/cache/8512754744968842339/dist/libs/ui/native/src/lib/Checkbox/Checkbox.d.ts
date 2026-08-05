export interface CheckboxProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
    helperText?: string;
    /** See `ui-web`'s `Checkbox` for the "select all" rationale. RN's `accessibilityState.checked` natively accepts `'mixed'`, so this maps directly - no ref/effect workaround needed here the way web requires. */
    indeterminate?: boolean;
    disabled?: boolean;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Checkbox`. No native RN checkbox
 * primitive exists, so this is a `Pressable` box + `Icon` rendered
 * conditionally, with `accessibilityRole="checkbox"` and
 * `accessibilityState.checked` (`true`/`false`/`'mixed'`) carrying the real
 * semantics for VoiceOver/TalkBack - the same "the artwork is decorative,
 * the accessibility props carry the meaning" split as web.
 */
export declare function Checkbox({ label, checked, onChange, error, helperText, indeterminate, disabled, testId }: CheckboxProps): import("react").JSX.Element;
//# sourceMappingURL=Checkbox.d.ts.map