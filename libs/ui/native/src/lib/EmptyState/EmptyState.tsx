import { View } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Button } from '../Button';
import type { IconName } from '@ecclesia/ui-core';

export interface EmptyStateAction {
  label: string;
  onPress: () => void;
}

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  tone?: 'neutral' | 'positive';
  testId?: string;
}

export function EmptyState({ icon, title, description, action, tone = 'neutral', testId }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      testID={testId}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[4],
        gap: theme.spacing[3],
      }}
    >
      {icon && (
        <Icon
          name={icon}
          size="lg"
          color={tone === 'positive' ? theme.colors.status.success.strong : theme.colors.text.secondary}
        />
      )}
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
      {action && (
        <Button variant="secondary" onPress={action.onPress} testId={testId ? `${testId}-action` : undefined}>
          {action.label}
        </Button>
      )}
    </View>
  );
}
