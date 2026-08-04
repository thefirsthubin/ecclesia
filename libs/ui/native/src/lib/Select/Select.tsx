import { useState } from 'react';
import { Pressable, View, Text as RNText, ScrollView } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Modal } from '../Modal';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Select`. RN has no native
 * `<select>` element, so this composes two components already in this
 * library rather than inventing a new overlay strategy: a `Pressable`
 * trigger styled to match `Input`, and this library's own `Modal`
 * (`variant="dialog"`) presenting the option list - `Modal` already proved
 * out the portal/focus-trap/dismissal behavior this needs, so `Select`
 * reuses it instead of re-solving the same problem.
 */
export function Select({ label, options, value, onChange, placeholder, error, helperText, disabled = false, testId }: SelectProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const borderColor = error ? theme.colors.status.danger.strong : theme.colors.border.default;

  return (
    <View style={{ gap: theme.spacing[1] }}>
      <RNText
        style={{
          fontFamily: theme.fontFamily.base,
          fontSize: theme.typography.label.fontSize,
          fontWeight: '600',
          letterSpacing: theme.typography.label.letterSpacing,
          color: theme.colors.text.secondary,
        }}
      >
        {label}
      </RNText>
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        testID={testId}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: selected?.label ?? placeholder }}
        accessibilityState={{ disabled }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: theme.touchTarget.minIOS,
          paddingHorizontal: theme.spacing[3],
          borderRadius: theme.radius.sm,
          borderWidth: 1,
          borderColor,
          backgroundColor: disabled ? theme.colors.surface.default : theme.colors.surface.raised,
          opacity: disabled ? theme.opacity.disabled : 1,
        }}
      >
        <RNText
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.body.fontSize,
            color: selected ? theme.colors.text.primary : theme.colors.text.disabled,
          }}
        >
          {selected?.label ?? placeholder ?? ' '}
        </RNText>
        <Icon name="chevronDown" size="sm" />
      </Pressable>
      {(error || helperText) && (
        <RNText
          accessibilityRole={error ? 'alert' : undefined}
          style={{
            fontFamily: theme.fontFamily.base,
            fontSize: theme.typography.caption.fontSize,
            color: error ? theme.colors.status.danger.strong : theme.colors.text.secondary,
          }}
        >
          {error ?? helperText}
        </RNText>
      )}
      <Modal isOpen={open} onClose={() => setOpen(false)} title={label} variant="dialog" testId={testId ? `${testId}-modal` : undefined}>
        <ScrollView style={{ maxHeight: 320 }}>
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <Pressable
                key={option.value}
                disabled={option.disabled}
                onPress={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: isSelected, disabled: option.disabled }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: theme.touchTarget.minIOS,
                  paddingHorizontal: theme.spacing[2],
                  opacity: option.disabled ? theme.opacity.disabled : 1,
                }}
              >
                <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}>
                  {option.label}
                </RNText>
                {isSelected && <Icon name="check" size="sm" color={theme.colors.brand.default} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </Modal>
    </View>
  );
}
