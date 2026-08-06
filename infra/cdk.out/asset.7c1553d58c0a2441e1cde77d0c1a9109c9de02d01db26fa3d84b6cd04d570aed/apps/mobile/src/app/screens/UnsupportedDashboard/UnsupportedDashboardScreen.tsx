import { View } from 'react-native';
import { EmptyState, useTheme } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

/**
 * `[Mobile Personas sprint]` The honest fallback `App.tsx`'s
 * `DashboardForRole` renders for any authenticated role this app has no
 * Dashboard screen for — `ASSISTANT_PASTOR`, `ADMIN`, `WORKER`, `MEMBER`,
 * `COUNCIL_OVERSEER`, `VISITOR`. This milestone named four personas
 * (Shepherd, Ministry Leader, Finance Officer, Resident Pastor); a
 * Dev-Auth user of any other role can still sign in (`AuthContext` has no
 * role allow-list), and `AppShell`'s `DEFAULT_TABS` fallback still gives
 * them a working Dashboard + Profile tab bar — this screen is what
 * "working Dashboard tab" means for a role with no real one, rather than
 * either crashing or silently borrowing another persona's screen (which
 * would show data/actions that role has no RBAC grant for and would
 * simply fail against the API, a far more confusing failure mode than
 * this explicit message).
 */
export function UnsupportedDashboardScreen({ role }: { role: RoleDto }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, padding: theme.spacing[4], justifyContent: 'center' }}>
      <EmptyState
        icon="infoCircle"
        title="No dashboard for this role yet"
        description={`The "${role}" persona isn't built into this app yet. Visit Profile to sign out.`}
      />
    </View>
  );
}
