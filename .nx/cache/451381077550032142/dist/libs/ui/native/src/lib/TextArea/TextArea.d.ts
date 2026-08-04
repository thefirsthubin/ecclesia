import { type TextInputProps } from 'react-native';
export interface TextAreaProps extends Omit<TextInputProps, 'style' | 'multiline'> {
    label: string;
    error?: string;
    helperText?: string;
    /** Approximate visible height in text lines - RN has no `rows` concept, this drives a `minHeight` computed from line height. Defaults to 4. */
    rows?: number;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `TextArea` - `Input`'s pattern
 * reapplied with `multiline` forced on and `textAlignVertical="top"` so
 * text starts at the top of the field like a real multi-line field rather
 * than vertically centering a single line (RN's default for multiline
 * TextInput on Android).
 */
export declare function TextArea({ label, error, helperText, rows, testId, editable, ...rest }: TextAreaProps): import("react").JSX.Element;
//# sourceMappingURL=TextArea.d.ts.map