import { type TextInputProps } from 'react-native';
export interface InputProps extends Omit<TextInputProps, 'style'> {
    label: string;
    error?: string;
    helperText?: string;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Input`. RN's `TextInput` has no
 * native `<label>` association - the label is rendered as sibling text
 * and linked via `accessibilityLabelledBy`/`nativeID` where the platform
 * supports it, falling back to `accessibilityLabel` mirroring the visible
 * label text so screen readers always announce it regardless of RN
 * version/platform quirks in `labelledBy` support.
 */
export declare function Input({ label, error, helperText, testId, editable, ...rest }: InputProps): import("react").JSX.Element;
//# sourceMappingURL=Input.d.ts.map