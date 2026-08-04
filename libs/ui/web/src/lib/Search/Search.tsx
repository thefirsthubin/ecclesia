import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

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
export function Search({ label, value, onChange, onSearch, debounceMs = 300, testId, id, ...rest }: SearchProps) {
  const theme = useTheme();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [focused, setFocused] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (!onSearch) {
      return;
    }
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (debounceMs === 0) {
      onSearch(value);
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => onSearch(value), debounceMs);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
    // Intentionally depends only on `value`/`debounceMs`, not `onSearch` -
    // this repo has no `eslint-plugin-react-hooks` installed (see
    // `ToastProvider.tsx`'s identical note), so there's no exhaustive-deps
    // rule to satisfy here either way.
  }, [value, debounceMs]);

  const clear = () => {
    onChange('');
    onSearch?.('');
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span aria-hidden style={{ position: 'absolute', left: theme.spacing[3], display: 'inline-flex', pointerEvents: 'none' }}>
        <Icon name="search" size="sm" />
      </span>
      <input
        {...rest}
        type="search"
        id={fieldId}
        aria-label={label}
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={{
          width: '100%',
          height: theme.touchTarget.minWeb,
          padding: `0 ${theme.spacing[8]}px 0 ${theme.spacing[8]}px`,
          borderRadius: theme.radius.sm,
          border: `1px solid ${focused ? theme.colors.border.focus : theme.colors.border.default}`,
          outline: focused ? `2px solid ${theme.colors.border.focus}` : 'none',
          outlineOffset: 1,
          backgroundColor: theme.colors.surface.raised,
          color: theme.colors.text.primary,
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.body.fontSize,
        }}
      />
      {value.length > 0 && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clear}
          style={{
            position: 'absolute',
            right: theme.spacing[2],
            display: 'inline-flex',
            border: 'none',
            background: 'none',
            padding: theme.spacing[1],
            cursor: 'pointer',
            color: theme.colors.text.secondary,
          }}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </div>
  );
}
