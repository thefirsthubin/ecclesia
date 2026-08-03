import { View } from 'react-native';
import { Heading, Text, useTheme } from '@ecclesia/ui-native';

/**
 * Design System §4.1's opening framing, applied literally: the first
 * thing on screen states the one question every widget below answers.
 * No data fetch of its own — a static greeting, not a card.
 */
export function DashboardHeader() {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing[1] }}>
      <Heading level={1}>Good morning</Heading>
      <Text variant="body" color={theme.colors.text.secondary}>
        {"Here's what needs your attention today."}
      </Text>
    </View>
  );
}
