export interface RecordOption {
    id: string;
    label: string;
    description?: string;
}
export interface RecordPickerProps {
    label: string;
    placeholder?: string;
    value: RecordOption | null;
    onChange: (value: RecordOption | null) => void;
    onSearch: (query: string) => Promise<RecordOption[]>;
    debounceMs?: number;
    error?: string;
    helperText?: string;
    testId?: string;
}
/**
 * React Native equivalent of `ui-web`'s `RecordPicker` - same
 * caller-supplied-`onSearch` contract and single-select scope (see that
 * file's doc comment). Reuses this library's own `Modal`
 * (`variant="dialog"`) for the search+results overlay, the same choice
 * `Select` made for its native option list - a full-screen dropdown
 * anchored under a trigger doesn't translate well to a phone-width
 * screen the way it does on web, so this is a modal search experience
 * instead, not a smaller port of the web dropdown.
 */
export declare function RecordPicker({ label, placeholder, value, onChange, onSearch, debounceMs, error, helperText, testId }: RecordPickerProps): import("react").JSX.Element;
//# sourceMappingURL=RecordPicker.d.ts.map