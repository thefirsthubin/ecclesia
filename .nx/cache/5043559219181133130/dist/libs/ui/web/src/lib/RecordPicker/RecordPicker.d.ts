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
    /** Caller-supplied async lookup - `ui-web` cannot call any app's API client directly (module-boundary rule, `UI_DESIGN_NOTES.md` §1), so a Person picker and a Group picker are the same component with a different `onSearch` wired in by the caller, not two components. */
    onSearch: (query: string) => Promise<RecordOption[]>;
    debounceMs?: number;
    error?: string;
    helperText?: string;
    testId?: string;
}
/**
 * An async-searchable single-record picker (e.g. "assign a Bacenta
 * Leader", "add a member to this Group") - Design System v1.0 Part 7
 * Data tier. Single-select only for this foundation slice (disclosed,
 * not an oversight - the same "one full vertical slice, not every case"
 * phasing this project has used throughout); a multi-select variant is a
 * reasonable follow-up once a real screen needs it.
 *
 * Once a value is selected it renders as a compact chip with a "Change"
 * action (not the search input) - re-searching replaces the whole
 * selection, there is no separate "add another" affordance since this is
 * single-select.
 */
export declare function RecordPicker({ label, placeholder, value, onChange, onSearch, debounceMs, error, helperText, testId }: RecordPickerProps): import("react").JSX.Element;
//# sourceMappingURL=RecordPicker.d.ts.map