import { Card, Divider, EmptyState, ErrorState, Heading, PageContainer, PageHeader, Skeleton, Text, useTheme } from '@ecclesia/ui-web';
import type { TenantListResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** `[Post-Milestone D — Portal Experiences follow-up]` `GET
 * /platform/tenants` - small per-page glue, the same "single-consumer
 * fetch not worth extracting into a shared hook file" precedent
 * `MinistryLeaderDashboard.tsx`'s own `useMinistryAttendanceTrend`
 * establishes. */
function useTenants(accessToken: string | undefined): AsyncDataResult<TenantListResponseDto> {
  return useAsyncData<TenantListResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<TenantListResponseDto>('/platform/tenants', { authToken: accessToken, signal });
    },
    [accessToken],
  );
}

/**
 * `[Milestone D — Portal Experiences, Portal 8: System Administrator]`
 * `SYSTEM_ADMINISTRATOR` previously fell to the generic "coming soon for
 * this role" stub. This role is deliberately locked-minimal by design
 * (`permission-matrix.ts`'s own inline comment): it holds exactly one
 * grant in the entire matrix, `platform.tenant.read` at `GLOBAL` scope -
 * no `people.*`/`pastoral_care.*`/`stewardship.*`/church-operational
 * grant of any kind, and correctly so (this role administers the
 * underlying multi-tenant platform, not any one church's ministry data).
 *
 * `[Post-Milestone D — Portal Experiences follow-up]` The Tenant list is
 * now real (`useTenants`, `GET /platform/tenants` via the new
 * `TenantsModule`) - closes the gap this page's own comment used to
 * disclose here. Still no provisioning/system-wide configuration surface
 * - `platform.tenant.read` is this role's only grant in the entire
 * matrix, so this page stays read-only, matching the actual permission
 * rather than building UI for a write capability that was never granted.
 */
export function SystemAdministratorDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const tenantsState = useTenants(accessToken);

  if (state.status !== 'authenticated') return null;

  return (
    <PageContainer maxWidth={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context="System Administrator" />
        <Card padding={6} testId="tenants-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Heading level={3}>Tenants</Heading>
            {tenantsState.status === 'loading' && <Skeleton height={20} />}
            {tenantsState.status === 'error' && <ErrorState title="Couldn't load Tenants" onRetry={tenantsState.refetch} />}
            {tenantsState.status === 'success' &&
              (tenantsState.data.length === 0 ? (
                <EmptyState icon="settings" title="No Tenants yet" description="No Tenants exist on the platform yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  {tenantsState.data.map((tenant, index) => (
                    <div key={tenant.id}>
                      {index > 0 && <Divider />}
                      <div style={{ paddingTop: index > 0 ? theme.spacing[3] : 0, display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
                        <Text variant="bodySmall">{tenant.name}</Text>
                        <Text variant="caption" color={theme.colors.text.secondary}>
                          Created {formatDate(tenant.createdAt)}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
