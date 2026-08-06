import { ScrollView, View } from 'react-native';
import { Button, Card, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';
import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { useActorSession } from '../../lib/session';
import { usePersonNameByToken } from '../../lib/usePersonName';
import { useGroupNameById } from './hooks/useGroupName';

/**
 * Same role catalog `apps/web-admin/src/app/shell/nav-items.ts`'s own
 * `ROLE_LABELS`/`roleLabel()` already defines - duplicated rather than
 * shared, for the same "these two apps' small glue pieces differ enough
 * in context to not be worth a premature shared lib" reasoning
 * `api-client.ts`'s own doc comment gives for `apiGet`/`apiPost`.
 *
 * `[Mobile Personas sprint]` This app now authenticates four roles
 * (`BACENTA_LEADER`, `BASONTA_LEADER`, `TREASURER`,
 * `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`) - this mapping's full
 * eleven-role coverage, kept complete since the Mobile Application Shell
 * sprint "costs nothing extra," now actually earns its keep.
 */
const ROLE_LABELS: Record<RoleDto, string> = {
  RESIDENT_PASTOR: 'Resident Pastor',
  ACTING_RESIDENT_PASTOR: 'Acting Resident Pastor',
  ASSISTANT_PASTOR: 'Assistant Pastor',
  BACENTA_LEADER: 'Bacenta Leader',
  BASONTA_LEADER: 'Basonta Leader',
  TREASURER: 'Treasurer',
  WORKER: 'Worker',
  USHER: 'Usher',
  MEMBER: 'Member',
  VISITOR: 'Visitor',
  ADMIN: 'Admin',
  COUNCIL_OVERSEER: 'Council Overseer',
};

/** `[Mobile Personas sprint]` Which group-scoped label (if any) this
 * screen's "Group" row shows, per role - `BRANCH`-scoped personas
 * (`TREASURER`, `RESIDENT_PASTOR`, `ACTING_RESIDENT_PASTOR`) have no
 * single Group of their own to name, so they simply have no entry here
 * and the whole row is omitted for them (see below) rather than shown
 * empty or hardcoded to "Branch-wide." */
const GROUP_LABELS: Partial<Record<RoleDto, string>> = {
  BACENTA_LEADER: 'Bacenta',
  BASONTA_LEADER: 'Basonta',
};

/**
 * Profile — the last item on every persona's bottom tab bar (Design
 * System §3.2 for the Shepherd; the same position on the three new
 * personas' own tab bars, `AppShell.tsx`). Real content, not a stub: the
 * signed-in Person's own name, role, own-Group name (Bacenta/Basonta
 * leaders only — see `GROUP_LABELS` above), and **Sign Out** —
 * `AuthContext.logout()` has existed since the Mobile Application Shell
 * sprint but was never wired to any UI until this screen gave it one.
 *
 * `[Mobile Personas sprint]` Generalized from a Shepherd-only screen to
 * one shared by all four personas — `useSession()`/`useGroupName()`/
 * `usePersonName()` (all three Bacenta-only, see their own doc comments)
 * replaced with `useActorSession()`/`useGroupNameById()`/
 * `usePersonNameByToken()` (`../../lib/usePersonName.ts`), none of which
 * assume a `bacentaId` exists. Rendered output for
 * `BACENTA_LEADER` is unchanged — same name/role/Bacenta-name/Sign-Out
 * layout as before ("Do NOT redesign the Shepherd experience"); this is
 * additive generalization, not a redesign.
 *
 * See `../../navigation/APP_SHELL_DESIGN_NOTES.md` for the full sprint
 * this screen was built alongside (the real bottom tab bar).
 */
export function ProfileScreen() {
  const theme = useTheme();
  const { state, logout } = useAuth();
  const session = useActorSession();
  const nameState = usePersonNameByToken(session.personId, session.authToken);
  const groupId = session.bacentaGroupId ?? session.basontaGroupId;
  const groupLabel = GROUP_LABELS[session.role];
  const groupState = useGroupNameById(groupId, session.authToken);

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

          {groupLabel && (
            <View style={{ gap: theme.spacing[1] }}>
              <Text variant="caption" color={theme.colors.text.secondary}>
                {groupLabel}
              </Text>
              {groupState.status === 'success' && groupState.data ? (
                <Text variant="body">{groupState.data.name}</Text>
              ) : (
                <Skeleton height={20} width="50%" />
              )}
            </View>
          )}
        </View>
      </Card>

      <Button variant="danger" onPress={logout} testId="profile-sign-out">
        Sign Out
      </Button>
    </ScrollView>
  );
}
