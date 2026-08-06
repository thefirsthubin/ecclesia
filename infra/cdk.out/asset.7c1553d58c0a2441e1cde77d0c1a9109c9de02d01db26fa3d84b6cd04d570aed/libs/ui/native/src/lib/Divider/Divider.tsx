import { View } from 'react-native';
import { useTheme } from '../ThemeProvider';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  testId?: string;
}

export function Divider({ orientation = 'horizontal', testId }: DividerProps) {
  const theme = useTheme();
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      testID={testId}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: theme.colors.border.subtle,
        width: isHorizontal ? '100%' : 1,
        height: isHorizontal ? 1 : '100%',
      }}
    />
  );
}
