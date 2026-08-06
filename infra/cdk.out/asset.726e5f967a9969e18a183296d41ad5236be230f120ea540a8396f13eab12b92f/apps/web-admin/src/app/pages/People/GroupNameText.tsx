import { Text, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { useGroupName } from './usePeopleData';

/**
 * Resolves a Group id into its display name for one history row -
 * `GroupMembershipResponseDto`/`RoleAssignmentResponseDto` only carry
 * `groupId`. Same per-row-fetch pattern `apps/mobile`'s `PersonNameText`
 * already established for the same class of problem (id -> display
 * value), not a new one invented for web.
 */
export function GroupNameText({ groupId }: { groupId: string }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const groupState = useGroupName(accessToken, groupId);

  if (groupState.status === 'loading') {
    return (
      <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
        Loading…
      </Text>
    );
  }
  if (groupState.status === 'error') {
    return (
      <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
        Unknown group
      </Text>
    );
  }
  return <Text as="span" variant="bodySmall">{groupState.data.name}</Text>;
}
