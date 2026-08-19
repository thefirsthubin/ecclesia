import type {
  CounsellingSessionResponseDto,
  CreateCounsellingSessionInput,
  CreateFollowUpTaskInput,
  CreateMemberInteractionInput,
  CreatePastoralNoteInput,
  CreatePrayerNoteInput,
  FollowUpTaskResponseDto,
  ListFollowUpTasksForActorQuery,
  ListSilentDriftFlagsForActorQuery,
  MemberInteractionResponseDto,
  PastoralCalendarResponseDto,
  PastoralNoteResponseDto,
  PersonResponseDto,
  PrayerNoteResponseDto,
  SilentDriftFlagResponseDto,
  UpdateCounsellingSessionStatusInput,
  UpdatePrayerNoteStatusInput,
} from '@ecclesia/contracts';
import type { ActorContext } from '@ecclesia/rbac';
import type { RecordOption } from '@ecclesia/ui-web';

import { apiGet, apiPatch, apiPost } from '../../lib/api-client';
import { useAsyncData } from '../../lib/useAsyncData';
import type { AsyncDataResult } from '../../lib/useAsyncData';

/**
 * Resolves the `GET /pastoral-care/follow-up-tasks` query for the current
 * actor's role - the exact same shape/reasoning as People's
 * `resolveDefaultPeopleQuery` (see
 * `apps/web-admin/.../People/PEOPLE_PAGE_DESIGN_NOTES.md` §3), applied to
 * `pastoral_care.followup_task.read`'s scope rows instead of
 * `people.person.read`'s. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §3 for
 * the full per-role table.
 *
 * `[Design Decision]` Same ASSISTANT_PASTOR simplification as People's:
 * CLUSTER scope spans every Bacenta in `actor.clusterBacentaIds`, but this
 * endpoint takes one `groupId` at a time - defaults to the first Bacenta
 * in the cluster.
 */
export function resolveDefaultFollowUpTaskQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'clusterBacentaIds'>,
): ListFollowUpTasksForActorQuery {
  switch (actor.role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      // RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR/ADMIN resolve to
      // whole-Branch (`pastoral_care.followup_task.read`'s BRANCH-scope
      // rows). Every other role (BASONTA_LEADER, WORKER, MEMBER, ...) has
      // no scope row for this action at all - falls through to the same
      // `{}` query, which the backend will correctly 403 rather than this
      // hook trying to pre-empt that (same precedent as People's list).
      return {};
  }
}

export function useFollowUpTaskQueue(
  accessToken: string | undefined,
  query: ListFollowUpTasksForActorQuery,
): AsyncDataResult<FollowUpTaskResponseDto[]> {
  return useAsyncData<FollowUpTaskResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.status) params.set('status', query.status.join(','));
      const qs = params.toString();
      return apiGet<FollowUpTaskResponseDto[]>(`/pastoral-care/follow-up-tasks${qs ? `?${qs}` : ''}`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, query.groupId, query.status?.join(',')],
  );
}

/**
 * `[Branch Pastor portal]` `ASSISTANT_PASTOR`'s real
 * `pastoral_care.followup_task.read` grant is CLUSTER (unchanged), which
 * spans every Bacenta in `actor.clusterBacentaIds` - not just the first
 * one `resolveDefaultFollowUpTaskQuery` defaults to (that function's own
 * disclosed limitation). The exact same `Promise.all` + dedupe-by-id shape
 * `usePeopleListForGroups` (`People/usePeopleData.ts`) already established
 * for the identical "one groupId per request, CLUSTER spans several"
 * mismatch - not a new backend capability, every individual request is
 * the same `GET /pastoral-care/follow-up-tasks?groupId=X` call
 * `useFollowUpTaskQueue` above already makes, run once per Bacenta the
 * actor's real CLUSTER grant already covers.
 */
export function useFollowUpTaskQueueForGroups(
  accessToken: string | undefined,
  groupIds: string[],
): AsyncDataResult<FollowUpTaskResponseDto[]> {
  return useAsyncData<FollowUpTaskResponseDto[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (groupIds.length === 0) return [];
      const perGroup = await Promise.all(
        groupIds.map((groupId) => {
          const params = new URLSearchParams({ groupId });
          return apiGet<FollowUpTaskResponseDto[]>(`/pastoral-care/follow-up-tasks?${params.toString()}`, { authToken: accessToken, signal });
        }),
      );
      const byId = new Map<string, FollowUpTaskResponseDto>();
      for (const task of perGroup.flat()) {
        byId.set(task.id, task);
      }
      return [...byId.values()];
    },
    [accessToken, groupIds.join(',')],
  );
}

/** `PATCH /follow-up-tasks/:id/complete` - no request body, same
 * no-payload PATCH shape `AlertPriorityCard`'s `resolve()` already
 * established for `PATCH /insights/alerts/:id/resolve`. */
export function completeFollowUpTask(accessToken: string, taskId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/complete`, {}, { authToken: accessToken });
}

/**
 * `PATCH /follow-up-tasks/:id/escalate` - BR-PC-04's caller-supplied
 * `escalatedToPersonId` (`escalateFollowUpTaskSchema`, `@ecclesia/contracts`)
 * - automatic "who is this Shepherd's organizational superior" resolution
 * isn't buildable from anything in the schema, so the picker's selection
 * *is* the business rule's required input, not a UI convenience on top of
 * one. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md` §4.
 */
export function escalateFollowUpTask(accessToken: string, taskId: string, escalatedToPersonId: string): Promise<FollowUpTaskResponseDto> {
  return apiPatch<FollowUpTaskResponseDto>(`/follow-up-tasks/${taskId}/escalate`, { escalatedToPersonId }, { authToken: accessToken });
}

/**
 * `RecordPicker`'s `onSearch` for the Escalate flow - reuses `GET
 * /people?search=`, the exact same endpoint/query param People's own
 * directory search already uses (People Web Admin sprint), rather than a
 * new search endpoint.
 *
 * `[Design Decision]` A known, disclosed limitation, not a silent
 * workaround: this search is scoped by the *acting* user's own
 * `people.person.read` grant, the same as every other `GET /people` call
 * in this app. A `BACENTA_LEADER` (OWN_GROUP scope) can therefore only
 * find escalation targets inside their own Bacenta - not the Assistant
 * Pastor above them an escalation is usually meant for. Fixing this
 * needs either a broader-than-OWN_GROUP search grant or a dedicated
 * "escalation targets" endpoint that resolves organizational superiors,
 * neither of which exists yet. See `PASTORAL_CARE_PAGE_DESIGN_NOTES.md`
 * §4/§9.
 */
export async function searchPeopleForEscalation(accessToken: string, query: string): Promise<RecordOption[]> {
  const params = new URLSearchParams();
  if (query.trim()) params.set('search', query.trim());
  const qs = params.toString();
  const people = await apiGet<PersonResponseDto[]>(`/people${qs ? `?${qs}` : ''}`, { authToken: accessToken });
  return people.map((person) => ({
    id: person.id,
    label: `${person.firstName} ${person.lastName}`,
    description: person.phone ?? person.email ?? undefined,
  }));
}

/**
 * `[Follow-up Task Creation milestone]` `POST /people/:personId/follow-up-tasks`
 * (FR-PC-03's explicit/manual creation path - see `createFollowUpTaskSchema`'s
 * own doc comment in `@ecclesia/contracts` for why `trigger` defaults to
 * `MANUAL` and no automatic-assignee resolution exists). `personId` is the
 * route's own path param - the subject Person the task concerns - not part
 * of the request body.
 *
 * **RBAC, traced against `permission-matrix.ts` directly, not assumed:**
 * `RESIDENT_PASTOR` holds `pastoral_care.followup_task.read`/`.update` at
 * BRANCH scope but **no `.create` row at all**; `ADMIN` holds only `.read`
 * at BRANCH. Only `ASSISTANT_PASTOR` (CLUSTER) and `BACENTA_LEADER`
 * (OWN_GROUP) can actually create a Follow-up task. Scope resolves from
 * the *subject Person's* own active Bacenta membership
 * (`PersonScopeService.loadResourceContext`, `apps/api`), not the acting
 * user's own group - the selected subject Person must actually belong to
 * a Bacenta the actor's scope reaches. None of this is enforced
 * client-side; the backend's real response is what the caller sees.
 */
export function createFollowUpTask(accessToken: string, personId: string, input: CreateFollowUpTaskInput): Promise<FollowUpTaskResponseDto> {
  return apiPost<FollowUpTaskResponseDto>(`/people/${personId}/follow-up-tasks`, input, { authToken: accessToken });
}

/**
 * `[Branch Pastor portal, Pastoral Care sprint]` `GET
 * /people/:personId/follow-up-tasks` - the "People -> Member -> Pastoral
 * Care" direction (see `PersonDetailPage.tsx`'s own Follow-ups tab). Every
 * one of the Person's tasks regardless of status, newest first - a
 * history view, not the open-only/SLA-urgency queue
 * `useFollowUpTaskQueue` above renders. Same RBAC action
 * (`pastoral_care.followup_task.read`) as every other read in this file -
 * a role that cannot already see this Person's Follow-ups via the queue
 * cannot see them here either; the backend's real 403 is what a denied
 * actor sees, same precedent as everywhere else in this app.
 */
export function usePersonFollowUpTasks(accessToken: string | undefined, personId: string): AsyncDataResult<FollowUpTaskResponseDto[]> {
  return useAsyncData<FollowUpTaskResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<FollowUpTaskResponseDto[]>(`/people/${personId}/follow-up-tasks`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/**
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]` `GET
 * /people/:personId/pastoral-notes` (§16.2, `pastoral_care.notes.read`) -
 * the general operational-note tier (Blueprint §9.3's own worked
 * example: "configuration authority does not imply pastoral-content
 * access" - `ADMIN` is an explicit `DENY`), distinct from the
 * author-only `PrayerNote` tier. First web-admin consumer of this
 * endpoint - the backend contract/RBAC already existed from Milestone B,
 * unused by any page until now.
 */
export function usePastoralNotes(accessToken: string | undefined, personId: string): AsyncDataResult<PastoralNoteResponseDto[]> {
  return useAsyncData<PastoralNoteResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PastoralNoteResponseDto[]>(`/people/${personId}/pastoral-notes`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/** `POST /people/:personId/pastoral-notes` (`pastoral_care.notes.create`).
 * Imperative, same shape as `createFollowUpTask` - triggered from a form
 * submit. `PastoralNote` is immutable once written (no `updatedAt`
 * column - `createPastoralNoteSchema`'s own doc comment), so there is no
 * corresponding update function. */
export function createPastoralNote(accessToken: string, personId: string, input: CreatePastoralNoteInput): Promise<PastoralNoteResponseDto> {
  return apiPost<PastoralNoteResponseDto>(`/people/${personId}/pastoral-notes`, input, { authToken: accessToken });
}

/**
 * `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` `GET
 * /people/:personId/prayer-notes` (`pastoral_care.prayer_note.read`,
 * RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at
 * CLUSTER - `BACENTA_LEADER`/`BASONTA_LEADER` hold no row at all for this
 * action). **Author-only, enforced server-side, not by this hook**:
 * `PrayerNoteRepository.findByPersonAndAuthor` filters on `authorPersonId
 * = actor.personId` in the WHERE clause itself, so another pastor's notes
 * for this same Person are never present in the response array at all -
 * there is nothing for this hook (or any client code) to additionally
 * filter. First web-admin surface for this model.
 */
export function usePrayerNotes(accessToken: string | undefined, personId: string): AsyncDataResult<PrayerNoteResponseDto[]> {
  return useAsyncData<PrayerNoteResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PrayerNoteResponseDto[]>(`/people/${personId}/prayer-notes`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/** `POST /people/:personId/prayer-notes` (`pastoral_care.prayer_note.create`).
 * `authorPersonId` is server-set to the acting user, never a request
 * field - the create body only carries `content`/`followUpDate`. */
export function createPrayerNote(accessToken: string, personId: string, input: CreatePrayerNoteInput): Promise<PrayerNoteResponseDto> {
  return apiPost<PrayerNoteResponseDto>(`/people/${personId}/prayer-notes`, input, { authToken: accessToken });
}

/** `PATCH /prayer-notes/:id/status` (`pastoral_care.prayer_note.update`) -
 * flat, not nested under `/people/:personId` (matches
 * `completeFollowUpTask`'s own flat-route precedent). Author-gated
 * server-side too: `PrayerNoteService` throws `ForbiddenException` if the
 * acting user did not author the note being updated. */
export function updatePrayerNoteStatus(accessToken: string, noteId: string, input: UpdatePrayerNoteStatusInput): Promise<PrayerNoteResponseDto> {
  return apiPatch<PrayerNoteResponseDto>(`/prayer-notes/${noteId}/status`, input, { authToken: accessToken });
}

/**
 * `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` `GET
 * /people/:personId/counselling-sessions` (`pastoral_care.counselling.read`,
 * RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at
 * CLUSTER). **Organizational scope, not author-only** - unlike Prayer
 * Notes, every pastor holding this grant sees every Counselling session
 * for this Person, not just their own (`CounsellingSessionRepository`'s
 * own doc comment on `listByPerson`, traced not assumed).
 */
export function useCounsellingSessions(accessToken: string | undefined, personId: string): AsyncDataResult<CounsellingSessionResponseDto[]> {
  return useAsyncData<CounsellingSessionResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<CounsellingSessionResponseDto[]>(`/people/${personId}/counselling-sessions`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/** `POST /people/:personId/counselling-sessions`
 * (`pastoral_care.counselling.create`). `counsellorPersonId` is server-set
 * to the acting user. */
export function createCounsellingSession(accessToken: string, personId: string, input: CreateCounsellingSessionInput): Promise<CounsellingSessionResponseDto> {
  return apiPost<CounsellingSessionResponseDto>(`/people/${personId}/counselling-sessions`, input, { authToken: accessToken });
}

/** `PATCH /counselling-sessions/:id/status`
 * (`pastoral_care.counselling.update`) - status transitions only
 * (`SCHEDULED`/`COMPLETED`/`CANCELLED`); no general-field update route
 * exists for `scheduledAt`/`briefNote` once created. */
export function updateCounsellingSessionStatus(accessToken: string, sessionId: string, input: UpdateCounsellingSessionStatusInput): Promise<CounsellingSessionResponseDto> {
  return apiPatch<CounsellingSessionResponseDto>(`/counselling-sessions/${sessionId}/status`, input, { authToken: accessToken });
}

/**
 * `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` `GET
 * /people/:personId/interactions` (`pastoral_care.interaction.read`,
 * RESIDENT_PASTOR/ACTING_RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at
 * CLUSTER). Organizational scope, not author-only - same as Counselling.
 */
export function useMemberInteractions(accessToken: string | undefined, personId: string): AsyncDataResult<MemberInteractionResponseDto[]> {
  return useAsyncData<MemberInteractionResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<MemberInteractionResponseDto[]>(`/people/${personId}/interactions`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/** `POST /people/:personId/interactions` (`pastoral_care.interaction.create`).
 * `pastorPersonId` is server-set to the acting user. Immutable once
 * created - no update/delete route exists for this model (traced, not
 * assumed: `MemberInteractionController` exposes only create + list). */
export function createMemberInteraction(accessToken: string, personId: string, input: CreateMemberInteractionInput): Promise<MemberInteractionResponseDto> {
  return apiPost<MemberInteractionResponseDto>(`/people/${personId}/interactions`, input, { authToken: accessToken });
}

export function usePersonName(accessToken: string | undefined, personId: string): AsyncDataResult<PersonResponseDto> {
  return useAsyncData<PersonResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      return apiGet<PersonResponseDto>(`/people/${personId}`, { authToken: accessToken, signal });
    },
    [accessToken, personId],
  );
}

/**
 * `[Silent-Drift Detection Branch-wide milestone]` Resolves the `GET
 * /pastoral-care/silent-drift-flags` query for the current actor's role -
 * a separate function from `resolveDefaultFollowUpTaskQuery`, not a
 * reuse of it, even though `pastoral_care.silent_drift_flag.read`'s scope
 * rows happen to name the identical four roles/scopes (traced against
 * `permission-matrix.ts`, not assumed): `RESIDENT_PASTOR`/`ADMIN`
 * (BRANCH), `ASSISTANT_PASTOR` (CLUSTER), `BACENTA_LEADER` (OWN_GROUP).
 * Kept independent since these are two different domain objects/endpoints
 * that could diverge later - same "small per-domain duplicate, not a
 * premature shared abstraction" precedent this codebase already applies
 * to `searchPeopleForEscalation`/`searchPeopleForGuardian`.
 */
export function resolveDefaultSilentDriftQuery(
  actor: Pick<ActorContext, 'role' | 'bacentaId' | 'clusterBacentaIds'>,
): ListSilentDriftFlagsForActorQuery {
  switch (actor.role) {
    case 'BACENTA_LEADER':
      return actor.bacentaId ? { groupId: actor.bacentaId } : {};
    case 'ASSISTANT_PASTOR':
      return actor.clusterBacentaIds?.[0] ? { groupId: actor.clusterBacentaIds[0] } : {};
    default:
      // RESIDENT_PASTOR/ADMIN resolve to whole-Branch (BRANCH-scope rows).
      // Every other role has no scope row for this action at all - falls
      // through to the same `{}` query, which the backend will correctly
      // 403 rather than this hook trying to pre-empt that.
      return {};
  }
}

/** `GET /pastoral-care/silent-drift-flags` - the BRANCH-wide/optional-
 * `groupId` listing this milestone adds. Read-only: `SilentDriftFlagController`
 * exposes no mutation route at all (traced, not assumed - no `PATCH`/`POST`
 * exists anywhere on that controller), so there is no resolve/escalate
 * action to wire up here, unlike Follow-up Tasks. */
export function useSilentDriftFlags(
  accessToken: string | undefined,
  query: ListSilentDriftFlagsForActorQuery,
): AsyncDataResult<SilentDriftFlagResponseDto[]> {
  return useAsyncData<SilentDriftFlagResponseDto[]>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams();
      if (query.groupId) params.set('groupId', query.groupId);
      if (query.status) params.set('status', query.status.join(','));
      const qs = params.toString();
      return apiGet<SilentDriftFlagResponseDto[]>(`/pastoral-care/silent-drift-flags${qs ? `?${qs}` : ''}`, {
        authToken: accessToken,
        signal,
      });
    },
    [accessToken, query.groupId, query.status?.join(',')],
  );
}

/**
 * `[Branch Pastor portal]` The same CLUSTER-spans-several-Bacentas fix as
 * `useFollowUpTaskQueueForGroups` above, applied to Silent-drift flags -
 * `pastoral_care.silent_drift_flag.read` is CLUSTER for `ASSISTANT_PASTOR`
 * too (traced against `permission-matrix.ts`, same as Follow-up Tasks'
 * own doc comment already establishes).
 */
export function useSilentDriftFlagsForGroups(
  accessToken: string | undefined,
  groupIds: string[],
): AsyncDataResult<SilentDriftFlagResponseDto[]> {
  return useAsyncData<SilentDriftFlagResponseDto[]>(
    async (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      if (groupIds.length === 0) return [];
      const perGroup = await Promise.all(
        groupIds.map((groupId) => {
          const params = new URLSearchParams({ groupId });
          return apiGet<SilentDriftFlagResponseDto[]>(`/pastoral-care/silent-drift-flags?${params.toString()}`, { authToken: accessToken, signal });
        }),
      );
      const byId = new Map<string, SilentDriftFlagResponseDto>();
      for (const flag of perGroup.flat()) {
        byId.set(flag.id, flag);
      }
      return [...byId.values()];
    },
    [accessToken, groupIds.join(',')],
  );
}

/**
 * `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` `GET
 * /pastoral-care/calendar` (`pastoral_care.interaction.read` - the most
 * restrictive of the three domains it composes, RESIDENT_PASTOR/
 * ACTING_RESIDENT_PASTOR at BRANCH, ASSISTANT_PASTOR at CLUSTER). A pure
 * composition read-model (Milestone B, Slice 7) - no `groupId` param, no
 * new backend capability; scope resolves entirely from the actor's own
 * grant, the same as every other BRANCH/CLUSTER-scoped endpoint in this
 * app. First web-admin consumer.
 */
export function usePastoralCalendar(accessToken: string | undefined, from: string, to: string): AsyncDataResult<PastoralCalendarResponseDto> {
  return useAsyncData<PastoralCalendarResponseDto>(
    (signal) => {
      if (!accessToken) return Promise.reject(new Error('not authenticated'));
      const params = new URLSearchParams({ from, to });
      return apiGet<PastoralCalendarResponseDto>(`/pastoral-care/calendar?${params.toString()}`, { authToken: accessToken, signal });
    },
    [accessToken, from, to],
  );
}
