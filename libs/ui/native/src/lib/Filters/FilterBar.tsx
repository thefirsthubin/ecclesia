import type { ReactNode } from 'react';
import { Pressable, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface FilterChipData {
  id: string;
  label: string;
}

export interface FilterBarProps {
  filters: FilterChipData[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  children?: ReactNode;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `FilterBar` - same thin-display,
 * not-a-filter-builder scope (see that file's doc comment). Wraps chips
 * with `flexWrap` since a phone-width row fits far fewer chips than web.
 */
export function FilterBar({ filters, onRemove, onClearAll, children, testId }: FilterBarProps) {
  const theme = useTheme();

  if (filters.length === 0 && !children) {
    return null;
  }

  return (
    <View testID={testId} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing[2] }}>
      {filters.map((filter) => (
        <View
          key={filter.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing[1],
            paddingHorizontal: theme.spacing[2],
            paddingVertical: theme.spacing[1],
            borderRadius: theme.radius.full,
            borderWidth: 1,
            borderColor: theme.colors.border.default,
            backgroundColor: theme.colors.surface.raised,
          }}
        >
          <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, color: theme.colors.text.primary }}>
            {filter.label}
          </RNText>
          <Pressable onPress={() => onRemove(filter.id)} accessibilityRole="button" accessibilityLabel={`Remove filter: ${filter.label}`} hitSlop={8}>
            <Icon name="close" size="sm" />
          </Pressable>
        </View>
      ))}
      {filters.length > 0 && onClearAll && (
        <Pressable onPress={onClearAll} accessibilityRole="button" accessibilityLabel="Clear all filters">
          <RNText style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.bodySmall.fontSize, fontWeight: '600', color: theme.colors.brand.default }}>
            Clear all
          </RNText>
        </Pressable>
      )}
      {children}
    </View>
  );
}
