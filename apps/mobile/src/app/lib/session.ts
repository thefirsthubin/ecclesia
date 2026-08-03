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
