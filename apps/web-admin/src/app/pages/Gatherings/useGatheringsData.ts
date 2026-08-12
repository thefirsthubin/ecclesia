import type {
  AttendanceRecordResponseDto,
  CreateGatheringInput,
  GatheringResponseDto,
  GatheringStatusDto,
  ListGatheringsQuery,
  UpdateGatheringInput,
} from '@ecclesia/contracts';
import { checkGatheringStatusTransition, GATHERING_STATUSES } from '@ecclesia/domain-gatherings';
import type { ActorContext } from '@ecclesia/rbac';

import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

export interface AttendanceCompletenessResult {
  incomplete: boolean;
  reason: string;
}

/**
 * Resolves the `GET /gatherings` query for the current actor's role - the
 * same shape/reasoning as People's `resolveDefaultPeopleQuery` and
 * Pastoral Care's `resolveDefaultFollowUpTaskQuery`, applied to
 * `gatherings.gathering.read`'s scope rows. See
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` §3 for the full per-role table.
 *
 * `[Bug fix, Branch Pastor Gatherings Access]` `ASSISTANT_PASTOR` now
 * mirrors `resolveDefaultPeopleQuery`'s own `ASSISTANT_PASTOR` branch
 * exactly: defaults to the first Bacenta in their cluster
 * (`clusterBacentaIds[0]`). This is a structural necessity, not a
 * stylistic choice - `ListGatheringsQuery.ownerGroupId` is a single group
 * id, and CLUSTER scope's own resource check
 * (`resourceInScope()`/`evaluate.ts`) can never match a resource with no
 * `bacentaId` at all, which is exactly what an unfiltered `GET
 * /gatherings` resolves to (`GatheringListResourceContextGuard`'s
 * Branch-only fallback). Without this, adding the matrix row alone would
 * still leave the actual page 403ing, since `{}` was the only query this
 * hook ever sent for this role.
 *
 * `[Bug fix, Basonta Leader Gatherings Access]` `BASONTA_LEADER` already
 * held its own `gatherings.gathering.read` OWN_GROUP grant (Mobile
 * Personas sprint, `permission-matrix.ts`) - not a matrix gap - but this
 * hook had no case defaulting it to `{ ownerGroupId: actor.basontaId }`,
 * so it fell through to the same unreachable `{}` query and 403'd. Same
 * class of bug as the ASSISTANT_PASTOR fix above, on the Basonta/Ministry
 * Leader persona instead of Branch Pastor; now closed the same way.
 */
export function resolveDefaultGatheringsQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'basontaId' | 'clusterBacentaIds'>,
): Pick<ListGatheringsQuery, 'ownerGroupId'> {
  if (actor.role === 'BACENTA_LEADER' && actor.bacentaId) {
    return { ownerGroupId: actor.bacentaId };
  }
  if (actor.role === 'BASONTA_LEADER' && actor.basontaId) {
    return { ownerGroupId: actor.basontaId };
  }
  if (actor.role === 'ASSISTANT_PASTOR' && actor.clusterBacentaIds?.[0]) {
    return { ownerGroupId: actor.clusterBacentaIds[0] };
  }
  // RESIDENT_PASTOR/ADMIN resolve to whole-Branch (BRANCH-scope rows).
  // Every other role either has no scope row for this action at all, or
  // nothing to default to - falls through to the same `{}` query, which
  // the backend correctly 403s rather than this hook trying to pre-empt
  // that.
  return {};
}

export function useGatheringsList(accessToken: string | undefined, query: ListGatheringsQuery): AsyncDataResult<GatheringResponseDto[]> {
  return useAsyncData<GatheringResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.ownerGroupId) params.set('ownerGroupId', query.ownerGroupId);
      if (query.type) params.set('type', query.type);
      const qs = params.toString();
      return apiGet<GatheringResponseDto[]>(`/gatherings${qs ? `?${qs}` : ''}`, { authToken: accessToken, signal });
    },
    [accessToken, query.ownerGroupId, query.type],
  );
}

/** `[Remaining Engineering Sprint, Milestone 11]` `GET /gatherings/:id` -
 * `StaffingTargetsPanel`'s own need to show a human-readable label
 * (type + date) for a Staffing Target's `gatheringId`, the same
 * "resolve a raw id into display text via a small dedicated hook" pattern
 * `usePersonName`/`useGroupName` already establish for their own domains. */
export function useGathering(accessToken: string | undefined, gatheringId: string | undefined): AsyncDataResult<GatheringResponseDto> {
  return useAsyncData<GatheringResponseDto>(
    (signal) => {
      if (!accessToken || !gatheringId) return Promise.reject(new Error('not authenticated or no Gathering id'));
      return apiGet<GatheringResponseDto>(`/gatherings/${gatheringId}`, { authToken: accessToken, signal });
    },
    [accessToken, gatheringId],
  );
}

/** `GET /gatherings/:id/attendance-records/completeness` (FR-GTH-05).
 * Not backed by a `libs/contracts` response schema - the endpoint returns
 * `libs/domain/gatherings`'s `AttendanceCompletenessOutcome` shape
 * directly, unvalidated on the way out (this codebase only runs
 * `ZodValidationPipe` against request bodies/queries, never responses). */
export function useAttendanceCompleteness(
  accessToken: string | undefined,
  gatheringId: string,
): AsyncDataResult<AttendanceCompletenessResult> {
  return useAsyncData<AttendanceCompletenessResult>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<AttendanceCompletenessResult>(`/gatherings/${gatheringId}/attendance-records/completeness`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, gatheringId],
  );
}

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase
 * 6 Gatherings workflow UI) - `GET /gatherings/:gatheringId/attendance-records`
 * (FR-GTH-03, `AttendanceRecordController.listByGathering`). A real,
 * already-implemented endpoint that no Web Admin screen called before
 * this - only its sibling `completeness` endpoint
 * (`useAttendanceCompleteness` above) was wired up. Read-only: this page
 * does not offer a way to record/edit attendance itself - per
 * `GATHERINGS_PAGE_DESIGN_NOTES.md` §5, Attendance Capture is a
 * deliberate, disclosed Usher-primary, mobile-only workflow
 * (`apps/mobile`'s `UsherAttendanceScreen`), not a gap this page works
 * around; duplicating a capture UI here would re-open a decision that
 * milestone already made deliberately, not close a real omission.
 *
 * **RBAC gap, traced against `permission-matrix.ts` directly, not
 * assumed:** `ASSISTANT_PASTOR` holds `gatherings.attendance.create`
 * (CLUSTER) but has **no `gatherings.attendance.read` row at all** -
 * every other role that can create attendance
 * (`BACENTA_LEADER`/`BASONTA_LEADER`/`ADMIN`/`USHER`) also has a
 * matching `.read` row, `ASSISTANT_PASTOR` is the one exception. A
 * Branch Pastor who records attendance therefore cannot read it back
 * through this view - a real, pre-existing backend defect, not
 * something this page can or should paper over. Not fixed here (out of
 * this phase's scope - RBAC rows are backend authorization semantics);
 * the backend's real 403 is what that role sees, same as every other
 * gated action in this app.
 */
export function useAttendanceRecords(accessToken: string | undefined, gatheringId: string): AsyncDataResult<AttendanceRecordResponseDto[]> {
  return useAsyncData<AttendanceRecordResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<AttendanceRecordResponseDto[]>(`/gatherings/${gatheringId}/attendance-records`, { authToken: accessToken, signal });
    },
    [accessToken, gatheringId],
  );
}

/**
 * `[Gathering Create/Update milestone]` `POST /gatherings` (PRD §17.3's
 * "Gathering: create/configure" row, FR-GTH-01/§12.4). Imperative, same
 * shape as every other create call in this app.
 *
 * **`type` is deliberately a free-text field, not a picker against a
 * configured list.** `libs/domain/gatherings`'s own `isConfiguredGatheringType`
 * exists but `GatheringService.create()` never calls it - Branch
 * Configuration (the screen that would let an Admin define
 * `gathering_types`) has no UI or write API anywhere in this codebase
 * (`RELEASE_1_WORKFLOW_MATRIX.md`), so there is no configured list to
 * validate against yet. Free text matches the server's own actual
 * behavior, not a client-side shortcut.
 *
 * **`ownerGroupId` is genuinely optional, but not equally reachable for
 * every role.** `RESIDENT_PASTOR` holds only `gatherings.gathering.read`
 * - no `.create` row at all (confirmed against `permission-matrix.ts`,
 * not assumed) - so this call always 403s for that persona. For
 * `ASSISTANT_PASTOR`(CLUSTER)/`BACENTA_LEADER`/`BASONTA_LEADER`(OWN_GROUP),
 * `GatheringCreateResourceContextGuard` resolves scope from *this*
 * request's own `ownerGroupId` (via `GroupScopeService`), unlike Role
 * Assignment's structural gap - so a real Bacenta/Basonta id here does
 * satisfy their scope. Omitting `ownerGroupId` (a Branch-wide Gathering)
 * resolves to a bare `{ branchId }` resource, which only a BRANCH-scoped
 * role (`ADMIN`) can ever satisfy. None of this is enforced client-side -
 * the backend's real response is what the caller sees either way.
 */
export function createGathering(accessToken: string, input: CreateGatheringInput): Promise<GatheringResponseDto> {
  return apiPost<GatheringResponseDto>('/gatherings', input, { authToken: accessToken });
}

/**
 * `[Gathering Create/Update milestone]` `PATCH /gatherings/:id`. Covers
 * `updateGatheringSchema`'s four editable fields the Web Admin edit form
 * actually exposes: `scheduledStart`, `scheduledEnd`, `venue`, `status`.
 * `config` (a free-form JSON blob, `Record<string, unknown>`) is left
 * out - the same "no generic JSON editor" judgment `createGathering`
 * already makes for the identical field on create, not a new omission
 * invented here.
 */
export function updateGathering(accessToken: string, gatheringId: string, input: UpdateGatheringInput): Promise<GatheringResponseDto> {
  return apiPatch<GatheringResponseDto>(`/gatherings/${gatheringId}`, input, { authToken: accessToken });
}

/**
 * `[Gathering Create/Update milestone]` Mirrors People's own
 * `nextLifecycleStageOptions` exactly: filters the real
 * `GATHERING_STATUSES` catalog through `libs/domain/gatherings`'s own
 * `checkGatheringStatusTransition` (the same function
 * `GatheringService.update()` validates against server-side), so the
 * edit form's Status picker can never offer a transition the server
 * would reject. `[INFERRED] forward-only` per that module's own doc
 * comment - `SCHEDULED` is the only non-terminal status, so this returns
 * `[]` for `CANCELLED`/`COMPLETED` (both terminal), leaving the Status
 * field showing only its own current, unchangeable value.
 */
export function nextGatheringStatusOptions(current: GatheringStatusDto): GatheringStatusDto[] {
  return GATHERING_STATUSES.filter((candidate) => candidate !== current && checkGatheringStatusTransition(current, candidate).allowed);
}
