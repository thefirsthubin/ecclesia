import { type InputHTMLAttributes } from 'react';
export interface SearchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'color' | 'type' | 'onChange'> {
    /** Accessible label for the field - Search has no visible `<label>` by default (Design System v1.0 Part 7.4's search fields are typically placed inline in a toolbar), so this becomes `aria-label` instead of a rendered `<label>`. Always required, never left to the placeholder alone (same "placeholder is never the only label" rule `Input` follows). */
    label: string;
    value: string;
    /** Fires on every keystroke - use for keeping the field itself controlled. */
    onChange: (value: string) => void;
    /** Fires `debounceMs` after the person stops typing - the callback a caller should actually query on. Defaults to 300ms. Pass `0` to disable debouncing (fire on every keystroke, same timing as `onChange`). */
    onSearch?: (value: string) => void;
    debounceMs?: number;
    testId?: string;
}
/**
 * A search field (Design System v1.0 Part 7.4) - `Input`'s pattern
 * reapplied with a leading search `Icon`, a trailing clear button once
 * there's a value, and built-in debouncing so every consuming screen
 * doesn't hand-roll its own `setTimeout` around `Input`. `type="search"`
 * gives the platform's own clear-on-Escape/IME behavior where the browser
 * provides it, on top of (not instead of) the explicit clear button
 * (not every browser renders a native clear affordance, and the explicit
 * button is keyboard/screen-reader reachable regardless of browser chrome).
 */
export declare function Search({ label, value, onChange, onSearch, debounceMs, testId, id, ...rest }: SearchProps): import("react").JSX.Element;
//# sourceMappingURL=Search.d.ts.map