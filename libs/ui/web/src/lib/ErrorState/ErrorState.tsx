import { useTheme } from '../ThemeProvider';
import { Icon } from '../Icon';
import { Heading } from '../Heading';
import { Text } from '../Text';
import { Button } from '../Button';

export interface ErrorStateProps {
  title: string;
  /** Plain-language explanation of what happened - never a raw error code or stack trace (Design System v1.0 Part 7.20, NFR-USA-01). */
  description?: string;
  onRetry?: () => void;
  testId?: string;
}

/** A designed failure state with a path forward (Design System v1.0 Part 7.20) - never a dead end. */
export function ErrorState({ title, description, onRetry, testId }: ErrorStateProps) {
  const theme = useTheme();

  return (
    <div
      data-testid={testId}
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: theme.spacing[2],
        padding: theme.spacing[8],
      }}
    >
      <Icon name="alertCircle" size="lg" color={theme.colors.status.danger.strong} />
      <Heading level={3}>{title}</Heading>
      {description && (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {description}
        </Text>
      )}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
