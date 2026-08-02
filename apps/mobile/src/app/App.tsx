/**
 * UI Foundation acceptance-criteria showcase - NOT a product screen.
 *
 * This proves apps/mobile renders through the shared design-token/
 * component platform (`@ecclesia/ui-native`, itself built on `@ecclesia/
 * ui-core` + `@ecclesia/ui-tokens` - the same tokens and theme logic
 * apps/web-admin uses via `@ecclesia/ui-web`). Real offline-first
 * attendance/offering capture screens (Blueprint §8.4, NFR-OFF-01/02;
 * PRD §11.4-§11.7 - Shepherds, Basonta Leaders, Treasurers, Members) are
 * added module by module in later milestones, assembled from this same
 * component set - nothing here should be mistaken for a business screen.
 */
import { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import {
  ThemeProvider,
  useTheme,
  Heading,
  Text,
  Button,
  Card,
  Badge,
} from '@ecclesia/ui-native';

export function App() {
  return (
    <ThemeProvider>
      <FoundationShowcase />
    </ThemeProvider>
  );
}

function FoundationShowcase() {
  const theme = useTheme();
  const [pulse, setPulse] = useState(0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface.default }}>
      <View style={{ padding: theme.spacing[6], gap: theme.spacing[4] }}>
        <Heading level={1}>Ecclesia</Heading>
        <Text variant="body" color={theme.colors.text.secondary}>
          UI Foundation showcase - shared tokens, theme, and base
          components. No business screens are implemented yet.
        </Text>

        <Card padding={6}>
          <View style={{ gap: theme.spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <Heading level={3}>Church Pulse</Heading>
              <Badge status={pulse > 0 ? 'success' : 'neutral'}>
                {pulse > 0 ? 'thriving' : 'no data'}
              </Badge>
            </View>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Every screen in this app will be assembled from the same
              tokens, theme, and primitives demonstrated here.
            </Text>
            <Button variant="primary" onPress={() => setPulse((p) => p + 1)}>
              Increment demo value
            </Button>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

export default App;
