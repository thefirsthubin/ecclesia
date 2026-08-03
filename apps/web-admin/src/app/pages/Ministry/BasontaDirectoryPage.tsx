import { Card, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { Link } from '../../router/router';
import { useBasontaDirectory } from './useMinistryData';

/**
 * The Basonta-directory tier of PRD §16.3's Ministry surface, for the
 * BRANCH-scoped roles (`RESIDENT_PASTOR`/`ADMIN`) who have permission to
 * see every roster in the Branch but, before this sprint, had no way to
 * discover which Basontas exist at all - see
 * `MINISTRY_PAGE_DESIGN_NOTES.md` §2 for the backend gap this closed.
 * Each row links to `/ministry/:id`'s roster view.
 */
export function BasontaDirectoryPage() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const directoryState = useBasontaDirectory(accessToken);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 640 }}>
      <Heading level={1}>Ministry</Heading>

      {directoryState.status === 'loading' && (
        <Card padding={6}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        </Card>
      )}

      {directoryState.status === 'error' && (
        <Card padding={6}>
          <ErrorState title="Couldn't load the Basonta directory" onRetry={directoryState.refetch} />
        </Card>
      )}

      {directoryState.status === 'success' && (
        <Card padding={6} testId="basonta-directory-card">
          {directoryState.data.length === 0 ? (
            <EmptyState title="No Basontas yet" description="No Ministry groups have been created in your Branch." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {directoryState.data.map((group, index) => (
                <div key={group.id}>
                  {index > 0 && <Divider />}
                  <Link to={`/ministry/${group.id}`}>
                    <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                      <Text variant="bodySmall">{group.name}</Text>
                      {group.category && (
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          {group.category}
                        </Text>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
