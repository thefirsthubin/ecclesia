import { type TextInputProps } from 'react-native';
export interface SearchProps extends Omit<TextInputProps, 'style' | 'value' | 'onChange' | 'onChangeText'> {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onSearch?: (value: string) => void;
    debounceMs?: number;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `Search` - same leading-icon +
 * trailing-clear-button + debounced `onSearch` behavior, `accessibilityLabel`
 * instead of a rendered `<label>` (same "search fields are toolbar-inline,
 * not full form fields" reasoning as web).
 */
export declare function Search({ label, value, onChange, onSearch, debounceMs, testId, ...rest }: SearchProps): import("react").JSX.Element;
//# sourceMappingURL=Search.d.ts.map