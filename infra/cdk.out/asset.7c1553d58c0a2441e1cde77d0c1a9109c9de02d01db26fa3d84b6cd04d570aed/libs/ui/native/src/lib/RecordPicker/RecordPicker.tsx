import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Modal } from '../Modal';

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
export function RecordPicker({ label, placeholder = 'Search…', value, onChange, onSearch, debounceMs = 300, error, helperText, testId }: RecordPickerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
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

  const openPicker = () => {
    onChange(null);
    setOpen(true);
  };

  const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;

  return (
    <View style={{ gap: theme.spacing[1] }}>
      <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.label.fontSize, fontWeight: '600', color: theme.colors.text.secondary }}>
        {label}
      </RNText>

      {value ? (
        <View
          testID={testId ? `${testId}-selected` : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing[3],
            paddingVertical: theme.spacing[2],
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            backgroundColor: theme.colors.surface.raised,
          }}
        >
          <View>
            <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>{value.label}</RNText>
            {value.description && (
              <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }}>
                {value.description}
              </RNText>
            )}
          </View>
          <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel="Change">
            <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: '600', color: theme.colors.brand.default }}>
              Change
            </RNText>
          </Pressable>
        </View>
      ) : (
        <Pressable
          testID={testId}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[2],
            height: theme.touchTarget.minIOS,
            paddingHorizontal: theme.spacing[3],
            borderRadius: theme.radius.sm,
            borderWidth: 1,
            borderColor,
            backgroundColor: theme.colors.surface.raised,
          }}
        >
          <Icon name="search" size="sm" />
          <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.disabled }}>{placeholder}</RNText>
        </Pressable>
      )}

      {(error || helperText) && (
        <RNText
          accessibilityRole={error ? 'alert' : undefined}
          style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary }}
        >
          {error ?? helperText}
        </RNText>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title={label} variant="dialog" testId={testId ? `${testId}-modal` : undefined}>
        <View style={{ gap: theme.spacing[3] }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            autoFocus
            // Not `label` again - the underlying trigger `Pressable` (still
            // mounted behind the open `Modal`, matching `Select`'s and
            // `Drawer`'s own choice not to unmount siblings while an
            // overlay is open) already carries that `accessibilityLabel`,
            // and `Modal`'s own `title` heading announces `label` on open -
            // a second identically-labelled element would be ambiguous to
            // both assistive tech and test queries.
            accessibilityLabel="Search"
            placeholderTextColor={theme.colors.text.disabled}
            style={{
              height: theme.touchTarget.minIOS,
              paddingHorizontal: theme.spacing[3],
              borderRadius: theme.radius.sm,
              borderWidth: 1,
              borderColor: theme.colors.border.default,
              backgroundColor: theme.colors.surface.default,
              color: theme.colors.text.primary,
              fontFamily: theme.fontFamily.base,
              fontSize: theme.typography.body.fontSize,
            }}
          />
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: theme.spacing[4] }}>
              <ActivityIndicator color={theme.colors.brand.default} />
            </View>
          ) : results.length === 0 && searched ? (
            <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.secondary }}>
              No matches{query ? ` for "${query}"` : ''}
            </RNText>
          ) : (
            results.map((option) => (
              <Pressable
                key={option.id}
                onPress={() => select(option)}
                accessibilityRole="menuitem"
                style={{ paddingVertical: theme.spacing[2] }}
              >
                <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>{option.label}</RNText>
                {option.description && (
                  <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.caption.fontSize, color: theme.colors.text.secondary }}>
                    {option.description}
                  </RNText>
                )}
              </Pressable>
            ))
          )}
        </View>
      </Modal>
    </View>
  );
}
