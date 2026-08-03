import { useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, View } from 'react-native';
import { Button, EmptyState, Heading, Icon, Text, useTheme } from '@ecclesia/ui-native';

import { useAuth } from '../../auth/AuthContext';

/**
 * Mobile's sign-in screen — Mobile Application Shell sprint. Unlike
 * `apps/web-admin`'s `LoginPage`, this screen has only one branch: the
 * development role picker. There is no Cognito/phone+OTP form to fall
 * back to (see `AuthContext.tsx`'s top comment for why), so when
 * `state.status === 'unsupported'` this screen shows an `EmptyState`
 * explaining that plainly instead of a broken or fake form.
 *
 * The radio-style picker is hand-built from `Pressable` + `Icon` rather
 * than reusing `Card`'s `interactive` mode, so it can carry a real
 * `accessibilityRole="radio"`/`accessibilityState.selected` pair — RN has
 * no native `<input type="radio">` the way `ui-web`'s picker leans on,
 * and `Card` doesn't expose a `selected` visual/accessibility state.
 * Still built from `@ecclesia/ui-native`'s existing 12 components (Text,
 * Icon, Button, Heading, EmptyState) plus plain RN primitives — no new
 * base component, matching the Shepherd Dashboard sprint's precedent.
 */
export function LoginScreen() {
  const theme = useTheme();
  const { state, devUsers, loginAsDevUser } = useAuth();
  const [selectedDevUserId, setSelectedDevUserId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const errorMessage = state.status === 'unauthenticated' ? state.error : undefined;

  const handleSignIn = async () => {
    if (!selectedDevUserId) return;
    setSubmitting(true);
    await loginAsDevUser(selectedDevUserId);
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing[4], justifyContent: 'center', gap: theme.spacing[4] }}>
        <Heading level={1}>Ecclesia</Heading>

        {state.status === 'unsupported' ? (
          <EmptyState
            icon="alertTriangle"
            title="Sign-in isn't available"
            description={`This build only supports development sign-in, and the API is running in "${state.mode}" mode. Point this app at an API with AUTH_MODE=development, or ask an admin about mobile access.`}
          />
        ) : (
          <View style={{ gap: theme.spacing[4] }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Development sign-in — select a seeded user.
            </Text>

            {errorMessage && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {errorMessage}
              </Text>
            )}

            {state.status !== 'restoring' && devUsers.length === 0 ? (
              <EmptyState
                icon="users"
                title="No development users seeded"
                description='Run "pnpm db:seed:dev" against this API and reload the app.'
              />
            ) : (
              <View accessibilityRole="radiogroup" style={{ gap: theme.spacing[2] }}>
                {devUsers.map((user) => {
                  const selected = selectedDevUserId === user.id;
                  return (
                    <Pressable
                      key={user.id}
                      onPress={() => setSelectedDevUserId(user.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${user.label}, ${user.role}`}
                      hitSlop={4}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: theme.spacing[3],
                        padding: theme.spacing[3],
                        minHeight: theme.touchTarget.minIOS,
                        borderRadius: theme.radius.md,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? theme.colors.brand.default : theme.colors.border.default,
                        backgroundColor: pressed ? theme.colors.border.subtle : theme.colors.surface.raised,
                      })}
                    >
                      <View style={{ flex: 1 }}>
                        <Text variant="body">{user.label}</Text>
                        <Text variant="bodySmall" color={theme.colors.text.secondary}>
                          {user.role}
                        </Text>
                      </View>
                      {selected && <Icon name="checkCircle" color={theme.colors.brand.default} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Button
              loading={submitting || state.status === 'restoring'}
              disabled={!selectedDevUserId}
              onPress={() => void handleSignIn()}
              testId="login-sign-in"
            >
              Sign in
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
