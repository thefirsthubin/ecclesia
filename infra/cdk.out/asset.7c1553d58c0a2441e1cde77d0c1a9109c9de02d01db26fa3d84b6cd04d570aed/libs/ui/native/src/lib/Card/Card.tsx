import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { getElevationStyle } from '../utils';
import type { ElevationLevel, SpacingStep } from '@ecclesia/ui-core';

export interface CardProps {
  children: React.ReactNode;
  padding?: SpacingStep;
  elevation?: ElevationLevel;
  interactive?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  testId?: string;
}

/** React Native equivalent of `ui-web`'s `Card` - `Pressable` when `interactive`, a plain `View` otherwise. */
export function Card({ children, padding = 4, elevation = 1, interactive = false, onPress, testId }: CardProps) {
  const theme = useTheme();

  const baseStyle = {
    padding: theme.spacing[padding],
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface.raised,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    ...getElevationStyle(theme, elevation),
  };

  if (!interactive) {
    return (
      <View testID={testId} style={baseStyle}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testId}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [baseStyle, pressed ? { opacity: 0.85 } : null]}
    >
      {children}
    </Pressable>
  );
}
