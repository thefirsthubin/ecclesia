import { Text, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { usePersonName } from './usePastoralCareData';

/**
 * Resolves a Person id into its display name for one queue row -
 * `FollowUpTaskResponseDto` only carries `personId`/`assignedToPersonId`.
 * Same id-to-display-value, per-row-fetch pattern as People's
 * `GroupNameText` (`apps/web-admin/.../People/GroupNameText.tsx`) and
 * `apps/mobile`'s `PersonNameText` before it - not a new pattern invented
 * here, just this module's own instance of it (`GET /people/:id`, built
 * the People Web Admin sprint).
 */
export function PersonNameText({ personId }: { personId: string }) {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const personState = usePersonName(accessToken, personId);

  if (personState.status === 'loading') {
    return (
      <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
        Loading…
      </Text>
    );
  }
  if (personState.status === 'error') {
    return (
      <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
        Unknown person
      </Text>
    );
  }
  return (
    <Text as="span" variant="bodySmall">
      {`${personState.data.firstName} ${personState.data.lastName}`}
    </Text>
  );
}
