import { Spinner, Text, useTheme } from '@ecclesia/ui-web';

/**
 * Shown while `AuthProvider`'s session-restoration check (STEP 4) is
 * in flight — both at `/` (`RootRedirect`, before it knows which way to
 * redirect) and on every protected route (`ProtectedRoute`), so a visitor
 * never sees a blank page while that check is pending.
 */
export function SessionRestoringScreen() {
  const theme = useTheme();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: theme.spacing[3] }}>
      <Spinner size="lg" label="Restoring your session" />
      <Text variant="bodySmall" color={theme.colors.text.secondary}>
        Restoring your session…
      </Text>
    </div>
  );
}
