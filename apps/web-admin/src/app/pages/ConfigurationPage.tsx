import { EmptyState } from '@ecclesia/ui-web';

import { useAuth } from '../auth/AuthContext';
import { StubPage } from './StubPage';

const ALLOWED_ROLES = ['ADMIN', 'COUNCIL_OVERSEER'] as const;

/**
 * Design System §3.1: "Configuration (Admin/Council Administrator roles
 * only)." The sidebar already hides this item for other roles
 * (`nav-items.ts`), but a direct URL visit must still be blocked
 * client-side - the real enforcement is server-side RBAC on whatever
 * endpoints a built-out Configuration page would call; this is a
 * navigation-level courtesy, not the security boundary.
 */
export function ConfigurationPage() {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;

  if (!ALLOWED_ROLES.includes(state.actor.role as (typeof ALLOWED_ROLES)[number])) {
    return (
      <EmptyState
        icon="alertCircle"
        title="You don't have access to Configuration"
        description="This section is limited to Admin and Council Overseer roles."
      />
    );
  }

  return <StubPage title="Configuration" />;
}
