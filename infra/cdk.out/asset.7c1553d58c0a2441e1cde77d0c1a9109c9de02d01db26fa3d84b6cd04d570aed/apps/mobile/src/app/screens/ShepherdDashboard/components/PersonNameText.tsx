import { Text } from '@ecclesia/ui-native';

import { usePersonName } from '../hooks/useShepherdDashboardData';

/**
 * Resolves a bare `personId` into a display name for a row (STEP 4's
 * `SilentDriftFlagRow`/`FollowUpTaskRow`). Renders the id as a fallback
 * while loading/on error rather than blocking the whole row on a name
 * lookup — the pastoral pattern (STEP 7/US-G3) is the row's primary
 * content either way.
 */
export function PersonNameText({ personId }: { personId: string }) {
  const state = usePersonName(personId);
  if (state.status === 'success') {
    return <Text variant="bodySmall" testId={`person-name-${personId}`}>{`${state.data.firstName} ${state.data.lastName}`}</Text>;
  }
  return (
    <Text variant="bodySmall" testId={`person-name-${personId}`}>
      Member
    </Text>
  );
}
