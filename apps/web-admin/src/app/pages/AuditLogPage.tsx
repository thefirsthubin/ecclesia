import { Badge, Card, ErrorState, Heading, PageContainer, Table, useTheme } from '@ecclesia/ui-web';
import type { TableColumn } from '@ecclesia/ui-web';
import type { AuditLogEntryResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../auth/AuthContext';
import { useAuditLog } from './useAuditLogData';

function formatOccurredAt(iso: string): string {
  return new Date(iso).toLocaleString();
}

/**
 * `[Audit Log milestone]` PRD §17.3's Audit Log matrix row, FR-ADM-02
 * (Release 1) - "immutable audit log of state-transition events... single
 * view, attributed+timestamped." No pre-emptive client-side role gate -
 * `useAuditLog` calls the real `GET /platform/audit-log` and the backend's
 * actual RBAC decision (`AuditLogResourceContextGuard` + `RbacGuard`)
 * drives what's shown: a 403 for a denied role renders the same
 * `ErrorState` as any other failed fetch, exactly like every other
 * backend-driven page in this app - never a duplicated authorization rule
 * client-side.
 *
 * **Reachable roles, traced against `permission-matrix.ts`, not
 * assumed**: RESIDENT_PASTOR and ADMIN (both BRANCH scope) and TREASURER
 * (BRANCH scope, server-filtered to Stewardship entries only) all
 * successfully load this page. ASSISTANT_PASTOR (CLUSTER) and
 * BACENTA_LEADER (OWN_GROUP) hold a PRD-granted `.read` row but can never
 * reach it in practice - `platform.audit_log` has no
 * `bacentaId`/cluster-membership column for `RbacGuard`'s scope check to
 * match against a Branch-wide resource, so every request from those two
 * roles 403s before this component's data even loads. See
 * `AuditLogController`'s own doc comment for the full explanation - not a
 * bug this page can fix, a schema/product-decision gap disclosed here
 * rather than silently worked around.
 *
 * No nav entry was added for this page (`nav-items.ts`) - Design System
 * v1.0 §3.1's stated nav taxonomy does not name "Audit Log" as a top-level
 * item (only Dashboard/People/Pastoral Care/Ministry/Gatherings/
 * Stewardship/Insights/Configuration), and inventing a placement for it is
 * exactly the kind of undocumented product decision this milestone's own
 * instructions say to stop at, not guess past. The route (`/audit-log`)
 * is wired and directly reachable; only its entry in the sidebar is the
 * open question.
 */
export function AuditLogPage() {
  const theme = useTheme();
  const { state } = useAuth();

  if (state.status !== 'authenticated') return null;

  const auditLogState = useAuditLog(state.accessToken);

  const columns: TableColumn<AuditLogEntryResponseDto>[] = [
    { key: 'occurredAt', header: 'When', render: (row) => formatOccurredAt(row.occurredAt), width: 200 },
    { key: 'action', header: 'Action', render: (row) => row.action },
    {
      key: 'effect',
      header: 'Effect',
      render: (row) =>
        row.effect ? <Badge status={row.effect === 'ALLOW' ? 'success' : 'danger'}>{row.effect}</Badge> : <Badge status="neutral">—</Badge>,
      width: 100,
    },
    { key: 'resourceType', header: 'Resource', render: (row) => (row.resourceType ? `${row.resourceType}${row.resourceId ? ` (${row.resourceId})` : ''}` : '—') },
    { key: 'actorUserId', header: 'Actor', render: (row) => row.actorUserId ?? 'Unknown (unauthenticated request)' },
    { key: 'reason', header: 'Reason', render: (row) => row.reason ?? '—' },
  ];

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <Heading level={1}>Audit Log</Heading>

        {auditLogState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load the Audit Log" onRetry={auditLogState.refetch} />
          </Card>
        )}

        {auditLogState.status !== 'error' && (
          <Card padding={0} testId="audit-log-table-card">
            <Table<AuditLogEntryResponseDto>
              columns={columns}
              data={auditLogState.status === 'success' ? auditLogState.data : []}
              getRowId={(row) => row.id}
              loading={auditLogState.status === 'loading'}
              emptyIcon="search"
              emptyTitle="No audit log entries yet"
              emptyDescription="Entries appear here as authorized denials and other tracked events occur."
              testId="audit-log-table"
            />
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
