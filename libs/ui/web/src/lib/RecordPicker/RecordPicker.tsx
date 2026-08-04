import { useEffect, useId, useRef, useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Spinner } from '../Spinner';

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
export function RecordPicker({ label, placeholder = 'Search…', value, onChange, onSearch, debounceMs = 300, error, helperText, testId }: RecordPickerProps) {
  const theme = useTheme();
  const fieldId = useId();
  const helperId = `${fieldId}-helper`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecordOption[]>([]);
  const [searched, setSearched] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      const thisRequest = ++requestId.current;
      setLoading(true);
      void onSearch(query)
        .then((found) => {
          if (requestId.current === thisRequest) {
            setResults(found);
            setSearched(true);
          }
        })
        .finally(() => {
          if (requestId.current === thisRequest) {
            setLoading(false);
          }
        });
    }, debounceMs);
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, open, debounceMs, onSearch]);

  const select = (option: RecordOption) => {
    onChange(option);
    setOpen(false);
    setQuery('');
    setSearched(false);
    setResults([]);
  };

  const startChange = () => {
    onChange(null);
    setOpen(true);
  };

  const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
      <label
        htmlFor={fieldId}
        style={{
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.label.fontSize,
          fontWeight: theme.typography.label.fontWeight,
          letterSpacing: theme.typography.label.letterSpacing,
          color: theme.colors.text.secondary,
        }}
      >
        {label}
      </label>

      {value && !open ? (
        <div
          data-testid={testId ? `${testId}-selected` : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing[2],
            padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.border.default}`,
            backgroundColor: theme.colors.surface.raised,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>{value.label}</span>
            {value.description && (
              <span style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }}>
                {value.description}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={startChange}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.brand.default, fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: 600 }}
          >
            Change
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <span aria-hidden style={{ position: 'absolute', left: theme.spacing[3], top: theme.spacing[3], pointerEvents: 'none' }}>
            <Icon name="search" size="sm" />
          </span>
          <input
            id={fieldId}
            data-testid={testId}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error || helperText ? helperId : undefined}
            value={query}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            style={{
              width: '100%',
              height: theme.touchTarget.minWeb,
              padding: `0 ${theme.spacing[3]}px 0 ${theme.spacing[8]}px`,
              borderRadius: theme.radius.sm,
              border: `1px solid ${borderColor}`,
              backgroundColor: theme.colors.surface.raised,
              color: theme.colors.text.primary,
              fontFamily: theme.fontFamily.base,
              fontSize: theme.typography.body.fontSize,
            }}
          />
          {open && (
            <div
              role="listbox"
              aria-label={label}
              style={{
                position: 'absolute',
                zIndex: theme.zIndex.dropdown,
                top: '100%',
                left: 0,
                right: 0,
                marginTop: theme.spacing[1],
                maxHeight: 240,
                overflowY: 'auto',
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border.default}`,
                backgroundColor: theme.colors.surface.raised,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.16)',
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: theme.spacing[4] }}>
                  <Spinner size="sm" />
                </div>
              ) : results.length === 0 && searched ? (
                <div style={{ padding: theme.spacing[3], fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.secondary }}>
                  No matches{query ? ` for "${query}"` : ''}
                </div>
              ) : (
                results.map((option) => (
                  <div
                    key={option.id}
                    role="option"
                    aria-selected={false}
                    onClick={() => select(option)}
                    style={{
                      padding: `${theme.spacing[2]}px ${theme.spacing[3]}px`,
                      cursor: 'pointer',
                      fontFamily: theme.fontFamily.base,
                      fontSize: theme.typography.body.fontSize,
                      color: theme.colors.text.primary,
                    }}
                  >
                    {option.label}
                    {option.description && (
                      <div style={{ fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }}>{option.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {(error || helperText) && (
        <span
          id={helperId}
          role={error ? 'alert' : undefined}
          style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary }}
        >
          {error ?? helperText}
        </span>
      )}
    </div>
  );
}
