import { View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Text } from '../Text';
import type { StatusKey } from '@ecclesia/ui-core';

export interface BadgeProps {
  children: string;
  status?: StatusKey;
  variant?: 'subtle' | 'solid';
  testId?: string;
}

/** React Native equivalent of `ui-web`'s `Badge` - identical token usage, `View`+`Text` instead of a styled `<span>`. */
export function Badge({ children, status = 'neutral', variant = 'subtle', testId }: BadgeProps) {
  const theme = useTheme();
  const statusColors = theme.colors.status[status];
  const background = variant === 'solid' ? statusColors.strong : statusColors.background;
  const color = variant === 'solid' ? theme.colors.text.inverse : statusColors.foreground;

  return (
    <View
      testID={testId}
      style={{
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing[2],
        paddingVertical: theme.spacing[1] / 2,
        borderRadius: theme.radius.full,
        backgroundColor: background,
      }}
    >
      <Text variant="label" color={color}>
        {children}
      </Text>
    </View>
  );
}
