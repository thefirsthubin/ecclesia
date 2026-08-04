import { Pressable, View, Text as RNText } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  testId?: string;
}

/**
 * React Native equivalent of `ui-web`'s `Pagination` - deliberately
 * simpler, not a straight port: a row of small numbered buttons is a poor
 * touch target on a phone screen, so this is Previous/Next plus a
 * "Page X of Y" label instead, the same "don't port a desktop-scale
 * interaction 1:1" judgment call `Tabs`' horizontal-`ScrollView` bar made.
 */
export function Pagination({ currentPage, totalPages, onPageChange, testId }: PaginationProps) {
  const theme = useTheme();
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View
      testID={testId}
      accessibilityRole="none"
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing[4] }}
    >
      <Pressable
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        accessibilityState={{ disabled: currentPage === 1 }}
        hitSlop={8}
        style={{ opacity: currentPage === 1 ? theme.opacity.disabled : 1, minHeight: theme.touchTarget.minIOS, justifyContent: 'center' }}
      >
        <Icon name="chevronLeft" size="sm" />
      </Pressable>
      <RNText
        accessibilityLabel={`Page ${currentPage} of ${totalPages}`}
        style={{ fontFamily: theme.fontFamily.base, fontSize: theme.typography.body.fontSize, color: theme.colors.text.primary }}
      >
        Page {currentPage} of {totalPages}
      </RNText>
      <Pressable
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        accessibilityRole="button"
        accessibilityLabel="Next page"
        accessibilityState={{ disabled: currentPage === totalPages }}
        hitSlop={8}
        style={{ opacity: currentPage === totalPages ? theme.opacity.disabled : 1, minHeight: theme.touchTarget.minIOS, justifyContent: 'center' }}
      >
        <Icon name="chevronRight" size="sm" />
      </Pressable>
    </View>
  );
}
