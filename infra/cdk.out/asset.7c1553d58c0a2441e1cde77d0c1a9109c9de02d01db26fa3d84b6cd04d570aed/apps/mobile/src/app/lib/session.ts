import type { RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../auth/AuthContext';

/**
 * `[Design Decision — Shepherd Dashboard sprint, superseded — Mobile
 * Application Shell sprint]` This file was originally a placeholder
 * returning fixed zero-UUID/empty values, because `apps/mobile` had no
 * sign-in flow at all (see git history / `SHEPHERD_DASHBOARD_DESIGN_NOTES.md`
 * "Known limitations" for that sprint's own disclosure of the gap, and
 * STEP 11's explicit prediction: "`lib/session.ts`'s `useSession()` is
 * the single seam a real sign-in flow replaces"). That prediction is what
 * this sprint acts on: `useSession()` now reads the real authenticated
 * actor from `AuthContext` (populated by `GET /auth/me` after Dev-Auth
 * sign-in) instead of returning placeholders.
 *
 * The exported `ShepherdSession` shape and `useSession()` name are
 * unchanged on purpose — every dashboard hook that already calls
 * `useSession()` (`useShepherdDashboardData.ts` and friends) required
 * zero changes for this sprint.
 *
 * `bacentaGroupId` is sourced from `ActorContext.bacentaId`, which is
 * only set for roles resolved with a Bacenta-level scope (`libs/rbac`'s
 * `ActorContextResolverService`) — `BACENTA_LEADER`, this app's only
 * real persona so far, is always one of those. If a future persona
 * without a `bacentaId` ever reaches this screen, this throws rather than
 * silently handing dashboard hooks an empty-string group id that would
 * look like a valid (if wrong) API call.
 */
export interface ShepherdSession {
  personId: string;
  branchId: string;
  /** The Shepherd's own Bacenta - every OWN_GROUP-scoped dashboard
   * endpoint is called with this id. */
  bacentaGroupId: string;
  /** Bearer token attached to every `apiClient` request. */
  authToken: string;
}

/**
 * Returns the current session. Must only be called from within a screen
 * that only renders once `AuthContext`'s state is `'authenticated'` (i.e.
 * inside the authenticated half of `App.tsx`'s auth gate) — calling this
 * beforehand is a programming error, not a recoverable state, so it
 * throws rather than returning placeholder data a caller could mistake
 * for real values.
 */
export function useSession(): ShepherdSession {
  const { state } = useAuth();
  if (state.status !== 'authenticated') {
    throw new Error('useSession() called outside an authenticated screen — AuthContext state is not "authenticated"');
  }
  const { actor, accessToken } = state;
  if (!actor.bacentaId) {
    throw new Error(`useSession(): authenticated actor (role "${actor.role}") has no bacentaId — this screen requires a Bacenta-scoped persona`);
  }
  return {
    personId: actor.personId,
    branchId: actor.branchId,
    bacentaGroupId: actor.bacentaId,
    authToken: accessToken,
  };
}

/**
 * `[Mobile Personas sprint]` The role-agnostic counterpart to
 * `useSession()` above, added once this app grew personas beyond
 * `BACENTA_LEADER` — `ministry.roster.read`/`insights.branch_dashboard.read`/
 * `stewardship.transaction.read` and friends are `OWN_GROUP`- or
 * `BRANCH`-scoped depending on the role, never `bacentaId`-scoped
 * specifically, so a Ministry Leader/Finance Officer/Resident Pastor
 * screen calling `useSession()` would throw immediately (that function's
 * own doc comment is explicit this is by design, not an oversight, for
 * the Shepherd-only persona it was written for).
 *
 * `useSession()` itself is left completely unchanged — every existing
 * Shepherd screen/hook that already calls it keeps working exactly as
 * before ("Do NOT redesign the Shepherd experience"). This is a sibling,
 * not a replacement.
 */
export interface ActorSession {
  personId: string;
  branchId: string;
  role: RoleDto;
  /** Present only for `BACENTA_LEADER`. */
  bacentaGroupId?: string;
  /** Present only for `BASONTA_LEADER`. */
  basontaGroupId?: string;
  /** Bearer token attached to every `apiClient` request. */
  authToken: string;
}

export function useActorSession(): ActorSession {
  const { state } = useAuth();
  if (state.status !== 'authenticated') {
    throw new Error('useActorSession() called outside an authenticated screen — AuthContext state is not "authenticated"');
  }
  const { actor, accessToken } = state;
  return {
    personId: actor.personId,
    branchId: actor.branchId,
    role: actor.role,
    bacentaGroupId: actor.bacentaId,
    basontaGroupId: actor.basontaId,
    authToken: accessToken,
  };
}

/**
 * The Ministry Leader (`BASONTA_LEADER`) equivalent of `useSession()` -
 * same "throw rather than hand a screen an empty-string group id" shape,
 * scoped to `actor.basontaId` instead of `actor.bacentaId`.
 */
export interface MinistrySession {
  personId: string;
  branchId: string;
  basontaGroupId: string;
  authToken: string;
}

export function useMinistrySession(): MinistrySession {
  const { state } = useAuth();
  if (state.status !== 'authenticated') {
    throw new Error('useMinistrySession() called outside an authenticated screen — AuthContext state is not "authenticated"');
  }
  const { actor, accessToken } = state;
  if (!actor.basontaId) {
    throw new Error(`useMinistrySession(): authenticated actor (role "${actor.role}") has no basontaId — this screen requires a Basonta-scoped persona`);
  }
  return {
    personId: actor.personId,
    branchId: actor.branchId,
    basontaGroupId: actor.basontaId,
    authToken: accessToken,
  };
}
