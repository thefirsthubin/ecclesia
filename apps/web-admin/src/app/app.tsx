import { useState } from 'react';
import {
  ThemeProvider,
  useTheme,
  Heading,
  Text,
  Button,
  Card,
  Badge,
} from '@ecclesia/ui-web';

/**
 * UI Foundation acceptance-criteria showcase - NOT a product screen.
 *
 * This proves apps/web-admin renders through the shared design-token/
 * component platform (`@ecclesia/ui-web`, itself built on `@ecclesia/
 * ui-core` + `@ecclesia/ui-tokens`) rather than any app-local styling.
 * Real per-role dashboards (PRD §16.6) and configuration surfaces
 * (PRD §16 "Platform & Administration") are added module by module in
 * later milestones, assembled from this same component set - nothing
 * here should be mistaken for a business screen.
 */
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
    <div style={{ padding: theme.spacing[8], display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 480 }}>
      <Heading level={1}>Ecclesia Admin Console</Heading>
      <Text variant="body" color={theme.colors.text.secondary}>
        UI Foundation showcase - shared tokens, theme, and base components.
        No business screens are implemented yet.
      </Text>

      <Card padding={6}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
            <Heading level={3}>Church Pulse</Heading>
            <Badge status={pulse > 0 ? 'success' : 'neutral'}>
              {pulse > 0 ? 'thriving' : 'no data'}
            </Badge>
          </div>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Every screen in this app will be assembled from the same
            tokens, theme, and primitives demonstrated here.
          </Text>
          <Button variant="primary" onClick={() => setPulse((p) => p + 1)}>
            Increment demo value
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default App;
