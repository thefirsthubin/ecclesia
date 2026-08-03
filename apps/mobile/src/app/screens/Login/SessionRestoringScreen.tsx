import { SafeAreaView, View } from 'react-native';
import { Spinner, Text, useTheme } from '@ecclesia/ui-native';

/**
 * Shown while `AuthContext`'s initial `GET /auth/mode` /
 * `GET /auth/dev/users` check (`state.status === 'restoring'`) is in
 * flight, mirroring `apps/web-admin`'s own `SessionRestoringScreen` so a
 * cold app launch never shows a blank screen while that resolves.
 */
export function SessionRestoringScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: theme.spacing[3] }}>
        <Spinner size="lg" label="Restoring your session" />
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          Restoring your session…
        </Text>
      </View>
    </SafeAreaView>
  );
}
