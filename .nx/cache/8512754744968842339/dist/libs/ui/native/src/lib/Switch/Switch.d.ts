export interface SwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    helperText?: string;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Switch`, built on RN's own
 * `Switch` primitive (the same "use the platform's real control rather
 * than reimplement it" choice `Modal` made for its portal/overlay) -
 * `Switch` is one of the few form controls RN ships natively with correct
 * platform-conventional visuals and built-in `accessibilityRole="switch"`
 * behavior on both iOS and Android.
 */
export declare function Switch({ label, checked, onChange, disabled, helperText, testId }: SwitchProps): import("react").JSX.Element;
//# sourceMappingURL=Switch.d.ts.map