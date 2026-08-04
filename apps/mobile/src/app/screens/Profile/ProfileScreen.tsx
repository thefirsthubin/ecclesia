import { ScrollView, View } from 'react-native';
import { Button, Card, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { useSession } from '../../lib/session';
import { usePersonName } from '../ShepherdDashboard/hooks/useShepherdDashboardData';
import { useGroupName } from './hooks/useGroupName';

/**
 * Same role catalog `apps/web-admin/src/app/shell/nav-items.ts`'s own
 * `ROLE_LABELS`/`roleLabel()` already defines - duplicated rather than
 * shared, for the same "these two apps' small glue pieces differ enough
 * in context to not be worth a premature shared lib" reasoning
 * `api-client.ts`'s own doc comment gives for `apiGet`/`apiPost`. In
 * practice this app only ever authenticates `BACENTA_LEADER`
 * (`useSession()` throws for any role without a `bacentaId` - see that
 * file's own doc comment), so this mapping is broader than this app
 * strictly needs today, but costs nothing extra to keep complete and
 * correct rather than hardcode a single label.
 */
const ROLE_LABELS: Record<RoleDto, string> = {
  RESIDENT_PASTOR: 'Resident Pastor',
  ACTING_RESIDENT_PASTOR: 'Acting Resident Pastor',
  ASSISTANT_PASTOR: 'Assistant Pastor',
  BACENTA_LEADER: 'Bacenta Leader',
  BASONTA_LEADER: 'Basonta Leader',
  TREASURER: 'Treasurer',
  WORKER: 'Worker',
  MEMBER: 'Member',
  VISITOR: 'Visitor',
  ADMIN: 'Admin',
  COUNCIL_OVERSEER: 'Council Overseer',
};

/**
 * Profile — the fifth and last item in Design System §3.2's Shepherd
 * bottom-tab-bar spec (Dashboard · Attendance · Follow-ups · Offering ·
 * Profile). Real content, not a stub: the signed-in Shepherd's own name
 * (`usePersonName`, reused from `ShepherdDashboard`), role, Bacenta name
 * (`useGroupName`, this screen's only new data need), and **Sign Out** —
 * `AuthContext.logout()` has existed since the Mobile Application Shell
 * sprint but was never wired to any UI until this screen gave it one.
 *
 * See `../../navigation/APP_SHELL_DESIGN_NOTES.md` for the full sprint
 * this screen was built alongside (the real bottom tab bar).
 */
export function ProfileScreen() {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const session = useSession();
  const nameState = usePersonName(session.personId);
  const groupState = useGroupName();

  if (state.status !== 'authenticated') {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Profile</Heading>

      <Card padding={4}>
        <View style={{ gap: theme.spacing[3] }}>
          {nameState.status === 'success' ? (
            <Heading level={3}>{`${nameState.data.firstName} ${nameState.data.lastName}`}</Heading>
          ) : (
            <Skeleton height={24} width="60%" />
          )}

          <View style={{ gap: theme.spacing[1] }}>
            <Text variant="caption" color={theme.colors.text.secondary}>
              Role
            </Text>
            <Text variant="body">{ROLE_LABELS[state.actor.role]}</Text>
          </View>

          <View style={{ gap: theme.spacing[1] }}>
            <Text variant="caption" color={theme.colors.text.secondary}>
              Bacenta
            </Text>
            {groupState.status === 'success' ? (
              <Text variant="body">{groupState.data.name}</Text>
            ) : (
              <Skeleton height={20} width="50%" />
            )}
          </View>
        </View>
      </Card>

      <Button variant="danger" onPress={logout} testId="profile-sign-out">
        Sign Out
      </Button>
    </ScrollView>
  );
}
