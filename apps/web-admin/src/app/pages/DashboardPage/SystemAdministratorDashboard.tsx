import { EmptyState, PageContainer, PageHeader, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';

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
 * **Genuine backend gap, not a frontend one**: no `Tenant`
 * controller/service/repository exists anywhere in `apps/api` yet
 * (confirmed by direct search) - `platform.tenant.read` is a real,
 * granted permission with zero backend implementation to exercise. Per
 * the Milestone D brief's own rule ("do not change database schema or
 * backend architecture unless a genuine UI blocker is discovered - stop
 * that specific feature and report the blocker"), this page discloses
 * that gap honestly rather than fabricating a Tenant list, a fake
 * platform-health chart, or reusing any church-operational data model
 * for a role explicitly walled off from it.
 */
export function SystemAdministratorDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  return (
    <PageContainer maxWidth={720}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context="System Administrator" />
        <EmptyState
          icon="settings"
          title="Nothing to administer yet"
          description="Your account holds platform-level access (Tenant visibility), but no platform administration backend exists yet in this release - no Tenant list, provisioning, or system-wide configuration endpoint has been built. This is a disclosed backend gap, not a hidden or broken feature."
          testId="system-administrator-dashboard-empty-state"
        />
      </div>
    </PageContainer>
  );
}
