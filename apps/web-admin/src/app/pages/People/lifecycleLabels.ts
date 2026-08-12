import { LIFECYCLE_STAGES } from '@ecclesia/domain-people';
import type { LifecycleStageDto } from '@ecclesia/contracts';

/**
 * `[UX Design Implementation]` Final UX Design Specification §19 (Phase 3
 * People workflow UI) - `PeopleListPage.tsx` and `PersonDetailPage.tsx`
 * each held their own copy of this exact mapping. `PersonDetailPage`'s
 * Overview tab badge never actually used its own copy - it hardcoded
 * `status="success"` regardless of the Person's real stage, so a Lapsed
 * or Visitor Person's own profile showed a green "on track" badge. A
 * single shared source, reused by both screens, both fixes that bug and
 * removes the drift risk that caused it. `LIFECYCLE_STAGES` (not a
 * hand-typed key order) is `@ecclesia/domain-people`'s own real state
 * list - the same constant `nextLifecycleStageOptions` already filters
 * through - so a stage can never be labeled here without also being a
 * real, modeled stage.
 */
export const LIFECYCLE_LABEL: Record<LifecycleStageDto, string> = {
  VISITOR: 'Visitor',
  FIRST_TIME_GUEST: 'First-time guest',
  FOLLOW_UP: 'Follow-up',
  LAPSED: 'Lapsed',
  ASSIGNED_TO_BACENTA: 'Assigned to Bacenta',
  SIX_WEEKS_PARTICIPATION: 'Six weeks participation',
  MEMBER: 'Member',
};

/** Green only for the state PRD §12.5 treats as the journey's successful
 * end (`MEMBER`); amber for the two states that name an open task
 * (`FOLLOW_UP`, a pending follow-up; `LAPSED`, a re-engagement need);
 * blue for ordinary in-progress states; gray for a Person not yet
 * started (`VISITOR`) - the same four-way mapping `PeopleListPage.tsx`
 * originated, now the one copy both screens read. */
export const LIFECYCLE_BADGE_STATUS: Record<LifecycleStageDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  VISITOR: 'neutral',
  FIRST_TIME_GUEST: 'info',
  FOLLOW_UP: 'warning',
  LAPSED: 'danger',
  ASSIGNED_TO_BACENTA: 'info',
  SIX_WEEKS_PARTICIPATION: 'info',
  MEMBER: 'success',
};

export const ORDERED_LIFECYCLE_STAGES: readonly LifecycleStageDto[] = LIFECYCLE_STAGES;
