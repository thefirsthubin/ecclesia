import { View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Button } from '../Button';

export interface ErrorStateProps {
  title: string;
  description?: string;
  onRetry?: () => void;
  testId?: string;
}

/** React Native equivalent of `ui-web`'s `ErrorState` - `accessibilityLiveRegion="assertive"` is RN's analogue of ARIA's `role="alert"`. */
export function ErrorState({ title, description, onRetry, testId }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      testID={testId}
      accessibilityLiveRegion="assertive"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[4],
        gap: theme.spacing[3],
      }}
    >
      <Icon name="alertTriangle" size="lg" color={theme.colors.status.danger.strong} />
      <Heading level={3} color={theme.colors.text.primary}>
        {title}
      </Heading>
      {description && (
        <View style={{ maxWidth: 320 }}>
          <Text variant="body" color={theme.colors.text.secondary}>
            {description}
          </Text>
        </View>
      )}
      {onRetry && (
        <Button variant="secondary" onPress={onRetry} testId={testId ? `${testId}-retry` : undefined}>
          Retry
        </Button>
      )}
    </View>
  );
}
