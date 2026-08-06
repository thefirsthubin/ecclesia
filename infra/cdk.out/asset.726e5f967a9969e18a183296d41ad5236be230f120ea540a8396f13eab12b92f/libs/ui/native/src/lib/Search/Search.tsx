import { useEffect, useRef } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

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
export function Search({ label, value, onChange, onSearch, debounceMs = 300, testId, ...rest }: SearchProps) {
  const theme = useTheme();
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
  }, [value, debounceMs]);

  const clear = () => {
    onChange('');
    onSearch?.('');
  };

  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: theme.spacing[3], zIndex: 1 }} pointerEvents="none">
        <Icon name="search" size="sm" />
      </View>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChange}
        testID={testId}
        accessibilityLabel={label}
        placeholderTextColor={theme.colors.text.disabled}
        style={{
          height: theme.touchTarget.minIOS,
          paddingLeft: theme.spacing[8],
          paddingRight: theme.spacing[8],
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor: theme.colors.border.default,
          backgroundColor: theme.colors.surface.raised,
          color: theme.colors.text.primary,
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.body.fontSize,
        }}
      />
      {value.length > 0 && (
        <Pressable
          onPress={clear}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          style={{ position: 'absolute', right: theme.spacing[3] }}
        >
          <Icon name="close" size="sm" />
        </Pressable>
      )}
    </View>
  );
}
