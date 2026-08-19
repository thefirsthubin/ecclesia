import { useState } from 'react';
import { Avatar, Badge, Button, Card, ErrorState, Heading, Icon, Input, RecordPicker, Select, Skeleton, Table, Tabs, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn, TabItem } from '@ecclesia/ui-web';
import { ROLE_VALUES } from '@ecclesia/contracts';
import type { FollowUpTaskResponseDto, GroupMembershipResponseDto, LifecycleStageDto, MemberInteractionTypeDto, RoleAssignmentResponseDto, RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { useParams } from '../../router/router';
import { roleLabel } from '../../shell/nav-items';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import {
  createCounsellingSession,
  createFollowUpTask,
  createMemberInteraction,
  createPastoralNote,
  createPrayerNote,
  searchPeopleForEscalation,
  updateCounsellingSessionStatus,
  updatePrayerNoteStatus,
  useCounsellingSessions,
  useMemberInteractions,
  usePastoralNotes,
  usePersonFollowUpTasks,
  usePrayerNotes,
} from '../PastoralCare/usePastoralCareData';
import { GroupNameText } from './GroupNameText';
import { LIFECYCLE_BADGE_STATUS, LIFECYCLE_LABEL } from './lifecycleLabels';
import {
  assignGroupMembership,
  GROUP_SCOPED_ROLES,
  grantRoleAssignment,
  nextLifecycleStageOptions,
  revokeRoleAssignment,
  searchGroupsForAssignment,
  transitionLifecycleStage,
  useGroupMembershipHistory,
  usePersonDetail,
  useRoleAssignmentHistory,
} from './usePeopleData';

/** Best-effort extraction of the server's actual denial/conflict reason
 * (`AllExceptionsFilter`'s `{ message: string | string[] }` body) - falls
 * back to the generic `ApiError.message` for anything else (network
 * failure, non-JSON body), matching `NewPersonForm.tsx`'s own precedent
 * for reading `ApiError.body`. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` Every
 * value `memberInteractionTypeSchema` (`@ecclesia/contracts`) accepts -
 * kept as a literal list rather than derived from the schema at runtime,
 * matching this file's own `nextLifecycleStageOptions`/`GROUP_SCOPED_ROLES`
 * precedent for small, stable enums. */
const MEMBER_INTERACTION_TYPE_LABEL: Record<MemberInteractionTypeDto, string> = {
  VISIT: 'Visit',
  CALL: 'Call',
  MEETING: 'Meeting',
  FOLLOW_UP: 'Follow-up',
  PRAYER: 'Prayer',
  COUNSELLING: 'Counselling',
};
const MEMBER_INTERACTION_TYPE_OPTIONS = (Object.keys(MEMBER_INTERACTION_TYPE_LABEL) as MemberInteractionTypeDto[]).map((value) => ({
  value,
  label: MEMBER_INTERACTION_TYPE_LABEL[value],
}));

/**
 * PRD §16.1's "Person profile view" surface: "Shows current stage,
 * current Group memberships, role history, attendance summary, giving
 * summary (permission-gated)." Attendance/giving summaries are Gatherings'
 * and Stewardship's own data respectively - out of scope for this sprint
 * (People page only), so this shows the fields People's own API actually
 * returns: profile fields, lifecycle stage, and full Group-membership +
 * Role-Assignment history (FR-PPL-07).
 *
 * `[UX Design Implementation]` Final UX Design Specification §15
 * (decision 5) - restructured onto three tabs (`Overview`/`Groups`/
 * `Roles`), replacing the prior single continuous scroll of three
 * stacked Cards. **Not the five-tab structure the decision's own
 * "likely structure" suggested** - read against the actual file before
 * this change, there is no "Follow-up" section on this page at all
 * (Follow-up Tasks live entirely on Pastoral Care's own queue, never
 * embedded here) and no "Journey" content distinct from the lifecycle
 * badge/transition control already inside the profile section - the
 * honest structure, per the Design Spec's own "do not invent
 * functionality" instruction, is exactly the three real content
 * groupings this page has always had, now tabbed instead of stacked.
 * Every action that existed before (transition, assign, grant, revoke)
 * remains reachable, just one tab click away instead of a scroll.
 */
export function PersonDetailPage() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  if (state.status !== 'authenticated') return null;

  const personState = usePersonDetail(state.accessToken, id);
  const membershipState = useGroupMembershipHistory(state.accessToken, id);
  const roleState = useRoleAssignmentHistory(state.accessToken, id);

  // `[Branch Pastor portal, Pastoral Care sprint]` The "People -> Member
  // -> Pastoral Care" direction (approved Pastoral Care brief §5) - a
  // tab restricted to the roles that actually hold
  // `pastoral_care.followup_task.read`/`pastoral_care.notes.read` at a
  // real scope (traced against `permission-matrix.ts`, not assumed):
  // `ASSISTANT_PASTOR` (CLUSTER, the original grant this tab was built
  // for), `BACENTA_LEADER` (OWN_GROUP, `[Milestone D — Portal Experiences,
  // Portal 3: Bacenta Leader]`), and now `RESIDENT_PASTOR`/
  // `ACTING_RESIDENT_PASTOR` (BRANCH, `[Milestone D, Portal 5: Resident
  // Pastor]` - this role held real follow-up-task/pastoral-notes grants
  // all along but had no web-admin tab surfacing them until now, the
  // exact same class of gap Portal 3 fixed for Bacenta Leader). Every
  // other role's render stays byte-for-byte identical to before
  // (`Overview`/`Groups`/`Roles` only).
  const canSeePastoralCareTab =
    state.actor.role === 'ASSISTANT_PASTOR' ||
    state.actor.role === 'BACENTA_LEADER' ||
    state.actor.role === 'RESIDENT_PASTOR' ||
    state.actor.role === 'ACTING_RESIDENT_PASTOR';
  const followUpHistoryState = usePersonFollowUpTasks(canSeePastoralCareTab ? state.accessToken : undefined, id);
  const pastoralNotesState = usePastoralNotes(canSeePastoralCareTab ? state.accessToken : undefined, id);

  // `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` The
  // private pastoral domain - Prayer Notes (author-only, enforced
  // server-side - see `usePrayerNotes`'s own doc comment), Counselling,
  // and Member Interactions - traced against `permission-matrix.ts`:
  // only `RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR` (BRANCH) and
  // `ASSISTANT_PASTOR` (CLUSTER) hold `pastoral_care.prayer_note.*`/
  // `.counselling.*`/`.interaction.*` at any scope - `BACENTA_LEADER`/
  // `BASONTA_LEADER` hold none of these three, by deliberate design (rule
  // 4 of the Milestone D brief: Bacenta/Basonta Leaders must never see
  // Prayer Note content). A narrower gate than `canSeePastoralCareTab`
  // above, nested within the same tab rather than a second tab.
  const canSeePrivatePastoralTools =
    state.actor.role === 'ASSISTANT_PASTOR' || state.actor.role === 'RESIDENT_PASTOR' || state.actor.role === 'ACTING_RESIDENT_PASTOR';
  const prayerNotesState = usePrayerNotes(canSeePrivatePastoralTools ? state.accessToken : undefined, id);
  const counsellingSessionsState = useCounsellingSessions(canSeePrivatePastoralTools ? state.accessToken : undefined, id);
  const memberInteractionsState = useMemberInteractions(canSeePrivatePastoralTools ? state.accessToken : undefined, id);

  // Declared before any conditional `return` below (Rules of Hooks) even
  // though this action only ever renders once `personState` has
  // succeeded - mirrors `usePersonDetail`/`useGroupMembershipHistory`
  // above, called unconditionally regardless of render branch.
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [transitionReason, setTransitionReason] = useState('');
  const [transitionSubmitting, setTransitionSubmitting] = useState(false);
  const [transitionError, setTransitionError] = useState<string | undefined>(undefined);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<RecordOption | null>(null);
  const [assignReason, setAssignReason] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | undefined>(undefined);
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantRoleValue, setGrantRoleValue] = useState('');
  const [grantGroupTarget, setGrantGroupTarget] = useState<RecordOption | null>(null);
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [grantError, setGrantError] = useState<string | undefined>(undefined);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeSubmitting, setRevokeSubmitting] = useState(false);
  const [revokeError, setRevokeError] = useState<string | undefined>(undefined);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [followUpAssignee, setFollowUpAssignee] = useState<RecordOption | null>(null);
  const [followUpGroupTarget, setFollowUpGroupTarget] = useState<RecordOption | null>(null);
  const [followUpDueAtOverride, setFollowUpDueAtOverride] = useState('');
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | undefined>(undefined);

  // `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
  // "Bacenta Leader operational notes" - same reveal-form shape as
  // Follow-up task creation just above.
  const [noteFormOpen, setNoteFormOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | undefined>(undefined);

  // `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]` Same
  // reveal-form shape as Pastoral Notes above, once per private-pastoral
  // domain. `resolvingPrayerNoteId`/`updatingSessionId` track which row's
  // status-update button is in flight (there is no bulk action, so one
  // in-flight id at a time is enough - the same "no concurrent mutations
  // on this page" assumption every other section here already makes).
  const [prayerNoteFormOpen, setPrayerNoteFormOpen] = useState(false);
  const [prayerNoteContent, setPrayerNoteContent] = useState('');
  const [prayerNoteFollowUpDate, setPrayerNoteFollowUpDate] = useState('');
  const [prayerNoteSubmitting, setPrayerNoteSubmitting] = useState(false);
  const [prayerNoteError, setPrayerNoteError] = useState<string | undefined>(undefined);
  const [resolvingPrayerNoteId, setResolvingPrayerNoteId] = useState<string | null>(null);

  const [counsellingFormOpen, setCounsellingFormOpen] = useState(false);
  const [counsellingScheduledAt, setCounsellingScheduledAt] = useState('');
  const [counsellingBriefNote, setCounsellingBriefNote] = useState('');
  const [counsellingSubmitting, setCounsellingSubmitting] = useState(false);
  const [counsellingError, setCounsellingError] = useState<string | undefined>(undefined);
  const [updatingSessionId, setUpdatingSessionId] = useState<string | null>(null);

  const [interactionFormOpen, setInteractionFormOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<MemberInteractionTypeDto | ''>('');
  const [interactionOccurredAt, setInteractionOccurredAt] = useState('');
  const [interactionBriefNote, setInteractionBriefNote] = useState('');
  const [interactionSubmitting, setInteractionSubmitting] = useState(false);
  const [interactionError, setInteractionError] = useState<string | undefined>(undefined);

  if (personState.status === 'loading') {
    return (
      <Card padding={6}>
        <Skeleton height={32} width="40%" />
      </Card>
    );
  }

  if (personState.status === 'error') {
    return (
      <Card padding={6}>
        <ErrorState title="Couldn't load this Person" onRetry={personState.refetch} />
      </Card>
    );
  }

  const person = personState.data;
  const stageOptions = nextLifecycleStageOptions(person.lifecycleStage);

  const openTransition = () => {
    setSelectedStage('');
    setTransitionReason('');
    setTransitionError(undefined);
    setTransitionOpen(true);
  };
  const cancelTransition = () => {
    setTransitionOpen(false);
    setTransitionError(undefined);
  };
  const submitTransition = async () => {
    if (!selectedStage) return;
    setTransitionSubmitting(true);
    setTransitionError(undefined);
    try {
      await transitionLifecycleStage(state.accessToken, person.id, {
        toStage: selectedStage as LifecycleStageDto,
        reason: transitionReason.trim().length > 0 ? transitionReason.trim() : undefined,
      });
      personState.refetch();
      setTransitionOpen(false);
    } catch (error) {
      setTransitionError(extractErrorMessage(error, 'Something went wrong transitioning this lifecycle stage.'));
    } finally {
      setTransitionSubmitting(false);
    }
  };

  const openAssign = () => {
    setAssignTarget(null);
    setAssignReason('');
    setAssignError(undefined);
    setAssignOpen(true);
  };
  const cancelAssign = () => {
    setAssignOpen(false);
    setAssignError(undefined);
  };
  const submitAssign = async () => {
    if (!assignTarget) return;
    setAssignSubmitting(true);
    setAssignError(undefined);
    try {
      await assignGroupMembership(state.accessToken, person.id, {
        groupId: assignTarget.id,
        reason: assignReason.trim().length > 0 ? assignReason.trim() : undefined,
      });
      membershipState.refetch();
      // PRD §19.1 step 6: opening a Bacenta membership for a Person in
      // FOLLOW_UP atomically advances their lifecycle stage server-side -
      // refetching the Person too so the Badge above reflects that real
      // side effect rather than showing a stale stage until the next
      // unrelated reload.
      personState.refetch();
      setAssignOpen(false);
    } catch (error) {
      setAssignError(extractErrorMessage(error, 'Something went wrong assigning this Bacenta/Basonta.'));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const grantRequiresGroup = GROUP_SCOPED_ROLES.includes(grantRoleValue as RoleDto);
  const openGrant = () => {
    setGrantRoleValue('');
    setGrantGroupTarget(null);
    setGrantError(undefined);
    setGrantOpen(true);
  };
  const cancelGrant = () => {
    setGrantOpen(false);
    setGrantError(undefined);
  };
  const submitGrant = async () => {
    if (!grantRoleValue || (grantRequiresGroup && !grantGroupTarget)) return;
    setGrantSubmitting(true);
    setGrantError(undefined);
    try {
      await grantRoleAssignment(state.accessToken, person.id, {
        role: grantRoleValue as RoleDto,
        groupId: grantGroupTarget?.id,
        scopeGroupIds: [],
      });
      roleState.refetch();
      setGrantOpen(false);
    } catch (error) {
      setGrantError(extractErrorMessage(error, 'Something went wrong granting this role.'));
    } finally {
      setGrantSubmitting(false);
    }
  };

  const openRevoke = (assignmentId: string) => {
    setRevokingId(assignmentId);
    setRevokeError(undefined);
  };
  const cancelRevoke = () => {
    setRevokingId(null);
    setRevokeError(undefined);
  };
  const submitRevoke = async (assignmentId: string) => {
    setRevokeSubmitting(true);
    setRevokeError(undefined);
    try {
      await revokeRoleAssignment(state.accessToken, person.id, assignmentId);
      roleState.refetch();
      setRevokingId(null);
    } catch (error) {
      setRevokeError(extractErrorMessage(error, 'Something went wrong revoking this role.'));
    } finally {
      setRevokeSubmitting(false);
    }
  };

  const openFollowUp = () => {
    setFollowUpAssignee(null);
    setFollowUpGroupTarget(null);
    setFollowUpDueAtOverride('');
    setFollowUpError(undefined);
    setFollowUpOpen(true);
  };
  const cancelFollowUp = () => {
    setFollowUpOpen(false);
    setFollowUpError(undefined);
  };
  const submitFollowUp = async () => {
    if (!followUpAssignee) return;
    setFollowUpSubmitting(true);
    setFollowUpError(undefined);
    try {
      await createFollowUpTask(state.accessToken, person.id, {
        assignedToPersonId: followUpAssignee.id,
        trigger: 'MANUAL',
        groupId: followUpGroupTarget?.id,
        dueAtOverride: followUpDueAtOverride ? new Date(followUpDueAtOverride).toISOString() : undefined,
      });
      toast.show({ status: 'success', message: `Follow-up task created for ${person.firstName} ${person.lastName}.` });
      setFollowUpOpen(false);
    } catch (error) {
      setFollowUpError(extractErrorMessage(error, 'Something went wrong creating this Follow-up task.'));
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  const openNote = () => {
    setNoteContent('');
    setNoteError(undefined);
    setNoteFormOpen(true);
  };
  const cancelNote = () => {
    setNoteFormOpen(false);
    setNoteError(undefined);
  };
  const submitNote = async () => {
    if (!noteContent.trim()) return;
    setNoteSubmitting(true);
    setNoteError(undefined);
    try {
      await createPastoralNote(state.accessToken, person.id, { content: noteContent.trim() });
      toast.show({ status: 'success', message: 'Note saved.' });
      setNoteFormOpen(false);
      pastoralNotesState.refetch();
    } catch (error) {
      setNoteError(extractErrorMessage(error, 'Something went wrong saving this note.'));
    } finally {
      setNoteSubmitting(false);
    }
  };

  const openPrayerNote = () => {
    setPrayerNoteContent('');
    setPrayerNoteFollowUpDate('');
    setPrayerNoteError(undefined);
    setPrayerNoteFormOpen(true);
  };
  const cancelPrayerNote = () => {
    setPrayerNoteFormOpen(false);
    setPrayerNoteError(undefined);
  };
  const submitPrayerNote = async () => {
    if (!prayerNoteContent.trim()) return;
    setPrayerNoteSubmitting(true);
    setPrayerNoteError(undefined);
    try {
      await createPrayerNote(state.accessToken, person.id, { content: prayerNoteContent.trim(), followUpDate: prayerNoteFollowUpDate || undefined });
      toast.show({ status: 'success', message: 'Prayer note saved.' });
      setPrayerNoteFormOpen(false);
      prayerNotesState.refetch();
    } catch (error) {
      setPrayerNoteError(extractErrorMessage(error, 'Something went wrong saving this Prayer note.'));
    } finally {
      setPrayerNoteSubmitting(false);
    }
  };
  const resolvePrayerNote = async (noteId: string) => {
    setResolvingPrayerNoteId(noteId);
    try {
      await updatePrayerNoteStatus(state.accessToken, noteId, { status: 'RESOLVED' });
      prayerNotesState.refetch();
    } catch (error) {
      toast.show({ status: 'danger', message: extractErrorMessage(error, 'Something went wrong updating this Prayer note.') });
    } finally {
      setResolvingPrayerNoteId(null);
    }
  };

  const openCounselling = () => {
    setCounsellingScheduledAt('');
    setCounsellingBriefNote('');
    setCounsellingError(undefined);
    setCounsellingFormOpen(true);
  };
  const cancelCounselling = () => {
    setCounsellingFormOpen(false);
    setCounsellingError(undefined);
  };
  const submitCounselling = async () => {
    if (!counsellingScheduledAt) return;
    setCounsellingSubmitting(true);
    setCounsellingError(undefined);
    try {
      await createCounsellingSession(state.accessToken, person.id, {
        scheduledAt: new Date(counsellingScheduledAt).toISOString(),
        briefNote: counsellingBriefNote.trim() ? counsellingBriefNote.trim() : undefined,
      });
      toast.show({ status: 'success', message: 'Counselling session scheduled.' });
      setCounsellingFormOpen(false);
      counsellingSessionsState.refetch();
    } catch (error) {
      setCounsellingError(extractErrorMessage(error, 'Something went wrong scheduling this Counselling session.'));
    } finally {
      setCounsellingSubmitting(false);
    }
  };
  const updateCounsellingStatus = async (sessionId: string, status: 'COMPLETED' | 'CANCELLED') => {
    setUpdatingSessionId(sessionId);
    try {
      await updateCounsellingSessionStatus(state.accessToken, sessionId, { status });
      counsellingSessionsState.refetch();
    } catch (error) {
      toast.show({ status: 'danger', message: extractErrorMessage(error, 'Something went wrong updating this Counselling session.') });
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const openInteraction = () => {
    setInteractionType('');
    setInteractionOccurredAt('');
    setInteractionBriefNote('');
    setInteractionError(undefined);
    setInteractionFormOpen(true);
  };
  const cancelInteraction = () => {
    setInteractionFormOpen(false);
    setInteractionError(undefined);
  };
  const submitInteraction = async () => {
    if (!interactionType || !interactionOccurredAt) return;
    setInteractionSubmitting(true);
    setInteractionError(undefined);
    try {
      await createMemberInteraction(state.accessToken, person.id, {
        type: interactionType,
        occurredAt: new Date(interactionOccurredAt).toISOString(),
        briefNote: interactionBriefNote.trim() ? interactionBriefNote.trim() : undefined,
      });
      toast.show({ status: 'success', message: 'Interaction logged.' });
      setInteractionFormOpen(false);
      memberInteractionsState.refetch();
    } catch (error) {
      setInteractionError(extractErrorMessage(error, 'Something went wrong logging this interaction.'));
    } finally {
      setInteractionSubmitting(false);
    }
  };

  // `[Wholesale visual redesign]` The member profile as the central
  // pastoral object: the identity block now surfaces their real *current*
  // Bacenta/Basonta inline (the most recent membership with no
  // `endedAt`, from `membershipState` - already fetched unconditionally
  // above for the Groups tab, not a new request) rather than requiring a
  // click into the Groups tab to see who this person belongs to today.
  // Universal for every role this page serves, not Branch-Pastor-only -
  // "who is this person's current Group" is core profile information for
  // any role that can open a Person record at all.
  const activeMembership = membershipState.status === 'success' ? membershipState.data.find((membership) => !membership.endedAt) : undefined;

  const overviewContent = (
    <div data-testid="person-profile-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
        <Avatar name={`${person.firstName} ${person.lastName}`} size="lg" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <Heading level="display">{`${person.firstName} ${person.lastName}`}</Heading>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            {/* `[UX Design Implementation]` Final UX Design Specification §19
                (Phase 3 People workflow UI) - this previously hardcoded
                `status="success"` regardless of the Person's real stage, so
                e.g. a Lapsed Person's own profile showed a green "on track"
                badge. Now the same `LIFECYCLE_BADGE_STATUS` mapping
                `PeopleListPage.tsx` already uses. */}
            <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage] ?? person.lifecycleStage}</Badge>
            {activeMembership && (
              <Text as="span" variant="bodySmall" color={theme.colors.text.secondary}>
                <GroupNameText groupId={activeMembership.groupId} />
              </Text>
            )}
          </div>
        </div>
      </div>
      {/* `[UX Design Implementation]` Final UX Design Specification §19
          (Phase 3 People workflow UI) - icon-labeled rows replace three
          unlabeled lines of text that were only distinguishable by their
          "No X on file" fallback copy. Same fields, same values, no new
          data - purely a scannability improvement. */}
      {/* `[Product Experience Sprint II, Phase 5]` Found during this
          sprint's own 390px check - a real seed email
          ("assistant.pastor@dev.ecclesia.local") had no wrap/truncation
          protection at all and pushed the whole page wider than the
          viewport, the same nested-flex overflow class this sprint
          already fixed elsewhere (`KpiCard`, `RecentActivityTimeline`,
          `LineChart`). Each row now gets `minWidth: 0` (the icon, an SVG
          with its own fixed width/height, was never the problem - the
          text next to it was) and the text itself gets a single-line
          ellipsis wrapper (`title` carries the untruncated value, same
          pattern `KpiCard`'s action-label footer already established) -
          a long email or address degrades gracefully instead of forcing
          overflow. */}
      <div style={{ marginTop: theme.spacing[4], display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], minWidth: 0 }}>
          <Icon name="phone" size="sm" color={theme.colors.text.secondary} />
          <div title={person.phone ?? undefined} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {person.phone ?? 'No phone on file'}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], minWidth: 0 }}>
          <Icon name="mail" size="sm" color={theme.colors.text.secondary} />
          <div title={person.email ?? undefined} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {person.email ?? 'No email on file'}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], minWidth: 0 }}>
          <Icon name="mapPin" size="sm" color={theme.colors.text.secondary} />
          <div title={person.address ?? undefined} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {person.address ?? 'No address on file'}
            </Text>
          </div>
        </div>
      </div>

      {/* `[Lifecycle Stage Transition milestone]` FR-PPL-03's Web Admin
          surface - omitted entirely (not a disabled button) once a
          Person reaches `MEMBER` (terminal, BR-PPL-03) or whenever the
          only modeled next step is `FOLLOW_UP -> ASSIGNED_TO_BACENTA`
          (routed through the not-yet-built Group Membership Assignment
          workflow instead, `nextLifecycleStageOptions`'s own doc
          comment). No client-side role check - `RbacGuard` is the only
          source of truth for who may submit this. */}
      {stageOptions.length > 0 && (
        <div style={{ marginTop: theme.spacing[4], paddingTop: theme.spacing[4], borderTop: `1px solid ${theme.colors.border.subtle}` }}>
          {!transitionOpen ? (
            <Button variant="secondary" size="sm" onClick={openTransition} accessibilityLabel="Transition lifecycle stage">
              Transition lifecycle stage
            </Button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="lifecycle-transition-form">
              <Select
                label="New stage"
                placeholder="Select a stage…"
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value)}
                options={stageOptions.map((stage) => ({ value: stage, label: LIFECYCLE_LABEL[stage] ?? stage }))}
              />
              <Input
                label="Reason (optional)"
                value={transitionReason}
                onChange={(event) => setTransitionReason(event.target.value)}
                placeholder="e.g. Reached by phone, ready to attend"
              />
              {transitionError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {transitionError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button variant="primary" size="sm" disabled={!selectedStage} loading={transitionSubmitting} onClick={() => void submitTransition()}>
                  Confirm transition
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelTransition}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* `[UX Design Implementation]` Final UX Design Specification §19
          (Phase 3 People workflow UI) - `POST /people/:personId/follow-up-tasks`
          (FR-PC-03's manual/explicit creation path) had no entry point
          from the Person's own page before this; the only way to create
          one for a specific Person was Pastoral Care's own queue, which
          required re-searching for the same Person a second time.
          Identical request shape and no-client-role-check precedent as
          `FollowUpTaskQueuePage.tsx`'s own "Create Follow-up task" form
          (`usePastoralCareData.ts`'s `createFollowUpTask` doc comment) -
          this reuses that exact function, just with the subject Person
          already fixed instead of asked for. Unconditionally offered,
          same as Transition/Assign/Grant above - the backend's real
          response is what a denied actor sees. */}
      <div style={{ marginTop: theme.spacing[4], paddingTop: theme.spacing[4], borderTop: `1px solid ${theme.colors.border.subtle}` }}>
        {!followUpOpen ? (
          <Button variant="secondary" size="sm" onClick={openFollowUp} accessibilityLabel="Create Follow-up task for this Person">
            Create Follow-up task
          </Button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="person-follow-up-form">
            <RecordPicker
              label="Assign to"
              placeholder="Search for who this task is assigned to…"
              value={followUpAssignee}
              onChange={setFollowUpAssignee}
              onSearch={(query) => searchPeopleForEscalation(state.accessToken, query)}
            />
            <RecordPicker
              label="Group (optional)"
              placeholder="Search for a Bacenta or Basonta…"
              value={followUpGroupTarget}
              onChange={setFollowUpGroupTarget}
              onSearch={(query) => searchGroupsForAssignment(state.accessToken, query)}
            />
            <Input
              label="Due date override (optional)"
              type="datetime-local"
              value={followUpDueAtOverride}
              onChange={(event) => setFollowUpDueAtOverride(event.target.value)}
            />
            {followUpError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {followUpError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button variant="primary" size="sm" disabled={!followUpAssignee} loading={followUpSubmitting} onClick={() => void submitFollowUp()}>
                Confirm create
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelFollowUp}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const membershipColumns: TableColumn<GroupMembershipResponseDto>[] = [
    {
      key: 'group',
      header: 'Group',
      render: (membership) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <GroupNameText groupId={membership.groupId} />
          <Badge status={membership.endedAt ? 'neutral' : 'success'}>{membership.endedAt ? 'Past' : 'Active'}</Badge>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (membership) => (
        <Text variant="caption" color={theme.colors.text.secondary}>
          {membership.endedAt ? `${formatDate(membership.startedAt)} – ${formatDate(membership.endedAt)}` : `Since ${formatDate(membership.startedAt)}`}
          {membership.reason ? ` · ${membership.reason}` : ''}
        </Text>
      ),
    },
  ];

  const roleColumns: TableColumn<RoleAssignmentResponseDto>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (assignment) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Text variant="bodySmall">{assignment.role.replace(/_/g, ' ')}</Text>
          <Badge status={assignment.effectiveTo ? 'neutral' : 'success'}>{assignment.effectiveTo ? 'Past' : 'Active'}</Badge>
        </div>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (assignment) => (
        <Text variant="caption" color={theme.colors.text.secondary}>
          {assignment.effectiveTo ? `${formatDate(assignment.effectiveFrom)} – ${formatDate(assignment.effectiveTo)}` : `Since ${formatDate(assignment.effectiveFrom)}`}
        </Text>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      // `[Role Assignment Revoke milestone]` Offered only for a row this
      // UI itself displays as "Active" (`!assignment.effectiveTo` - the
      // same condition the Badge above already uses) - a past assignment
      // has nothing left to revoke. No further client-side eligibility
      // check: the backend's real response (including its own "is this
      // actually still active" check) is authoritative, same as
      // `grantRoleAssignment`.
      render: (assignment) =>
        !assignment.effectiveTo && revokingId !== assignment.id ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="danger" size="sm" onClick={() => openRevoke(assignment.id)} accessibilityLabel={`Revoke role: ${assignment.role}`}>
              Revoke
            </Button>
          </div>
        ) : null,
    },
  ];

  const groupsContent = (
    <div data-testid="group-membership-history-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Heading level={3}>Bacenta / Basonta history</Heading>
          {!assignOpen && (
            <Button variant="secondary" size="sm" onClick={openAssign} accessibilityLabel="Assign to Bacenta or Basonta">
              Assign to Bacenta/Basonta
            </Button>
          )}
        </div>

        {/* `[Group Membership Assignment milestone]` PRD §17.3's
            "Bacenta/Basonta: reassign member" row - always offered, no
            precondition on the Person's current state, since both a
            first-ever assignment and a reassignment (or an additional
            concurrent Basonta) go through this same endpoint;
            `POST /people/:id/group-memberships` (`GroupMembershipService.assign`)
            is the only source of truth for whether a given target
            Group/reason combination is actually valid - see
            `searchGroupsForAssignment`/`assignGroupMembership`'s own
            doc comments in `usePeopleData.ts` for why neither the
            reason requirement nor Group-list scoping is predicted
            client-side. */}
        {assignOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="group-assignment-form">
            <RecordPicker
              label="Bacenta or Basonta"
              placeholder="Search for a Group…"
              value={assignTarget}
              onChange={setAssignTarget}
              onSearch={(query) => searchGroupsForAssignment(state.accessToken, query)}
            />
            <Input
              label="Reason (required only for a reassignment)"
              value={assignReason}
              onChange={(event) => setAssignReason(event.target.value)}
              placeholder="e.g. Moved house, closer to new Bacenta"
            />
            {assignError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {assignError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button variant="primary" size="sm" disabled={!assignTarget} loading={assignSubmitting} onClick={() => void submitAssign()}>
                Confirm assignment
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelAssign}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {membershipState.status === 'loading' && <Skeleton height={20} />}
        {membershipState.status === 'error' && <ErrorState title="Couldn't load membership history" onRetry={membershipState.refetch} />}
        {membershipState.status === 'success' && (
          <Table
            testId="group-membership-history-table"
            columns={membershipColumns}
            data={membershipState.data}
            getRowId={(membership) => membership.id}
            emptyTitle="No group history yet"
          />
        )}
      </div>
    </div>
  );

  const rolesContent = (
    <div data-testid="role-assignment-history-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <Heading level={3}>Role history</Heading>
          {!grantOpen && (
            <Button variant="secondary" size="sm" onClick={openGrant} accessibilityLabel="Grant role">
              Grant role
            </Button>
          )}
        </div>

        {/* `[Role Assignment Management milestone]` PRD §17.3's "Role
            Assignment: grant Shepherd/Worker/etc." row - always
            offered, no client-side role check (`grantRoleAssignment`'s
            own doc comment in `usePeopleData.ts` traces exactly who
            the real matrix grants this to, including that `ADMIN`
            genuinely has no grant authority here). */}
        {grantOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="role-grant-form">
            <Select
              label="Role"
              placeholder="Select a role…"
              value={grantRoleValue}
              onChange={(event) => {
                setGrantRoleValue(event.target.value);
                setGrantGroupTarget(null);
              }}
              options={ROLE_VALUES.map((role) => ({ value: role, label: roleLabel(role) }))}
            />
            {grantRequiresGroup && (
              <RecordPicker
                label="Bacenta or Basonta"
                placeholder="Search for a Group…"
                value={grantGroupTarget}
                onChange={setGrantGroupTarget}
                onSearch={(query) => searchGroupsForAssignment(state.accessToken, query)}
              />
            )}
            {grantError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {grantError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button
                variant="primary"
                size="sm"
                disabled={!grantRoleValue || (grantRequiresGroup && !grantGroupTarget)}
                loading={grantSubmitting}
                onClick={() => void submitGrant()}
              >
                Confirm grant
              </Button>
              <Button variant="secondary" size="sm" onClick={cancelGrant}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {roleState.status === 'loading' && <Skeleton height={20} />}
        {roleState.status === 'error' && <ErrorState title="Couldn't load role history" onRetry={roleState.refetch} />}
        {roleState.status === 'success' && (
          <Table
            testId="role-assignment-history-table"
            columns={roleColumns}
            data={roleState.data}
            getRowId={(assignment) => assignment.id}
            isRowExpanded={(assignment) => revokingId === assignment.id}
            renderRowDetail={(assignment) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="role-revoke-confirm">
                <Text variant="bodySmall">{`Revoke ${assignment.role.replace(/_/g, ' ')}? This ends the assignment effective now.`}</Text>
                {revokeError && (
                  <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                    {revokeError}
                  </Text>
                )}
                <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                  <Button variant="danger" size="sm" loading={revokeSubmitting} onClick={() => void submitRevoke(assignment.id)}>
                    Confirm revoke
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancelRevoke}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            emptyTitle="No roles held yet"
          />
        )}
      </div>
    </div>
  );

  const followUpHistoryColumns: TableColumn<FollowUpTaskResponseDto>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (task) => (
        <Badge status={task.status === 'COMPLETED' ? 'success' : task.status === 'ESCALATED' ? 'danger' : 'warning'}>
          {task.status === 'COMPLETED' ? 'Completed' : task.status === 'ESCALATED' ? 'Escalated' : 'Open'}
        </Badge>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned to',
      render: (task) => <PersonNameText personId={task.assignedToPersonId} />,
    },
    {
      key: 'due',
      header: 'Due',
      render: (task) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {task.dueAt ? formatDate(task.dueAt) : '—'}
        </Text>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (task) => (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {formatDate(task.createdAt)}
        </Text>
      ),
    },
  ];

  /** `[Branch Pastor portal, Pastoral Care sprint]` The "People -> Member
   * -> Pastoral Care" direction (approved Pastoral Care brief §5) - a
   * read-only history, not a duplicate of the Overview tab's own "Create
   * Follow-up task" action above (that already exists; this only closes
   * the missing read direction). Every status shown, not just open ones -
   * a history view, matching `usePersonFollowUpTasks`'s own doc comment. */
  const pastoralCareContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
      <div data-testid="person-follow-up-history-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <Heading level={3}>Follow-ups</Heading>
          {followUpHistoryState.status === 'loading' && <Skeleton height={20} />}
          {followUpHistoryState.status === 'error' && <ErrorState title="Couldn't load Follow-up history" onRetry={followUpHistoryState.refetch} />}
          {followUpHistoryState.status === 'success' && (
            <Table
              testId="person-follow-up-history-table"
              columns={followUpHistoryColumns}
              data={followUpHistoryState.data}
              getRowId={(task) => task.id}
              emptyTitle="No Follow-ups yet"
            />
          )}
        </div>
      </div>

      {/* `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
          "Bacenta Leader operational notes" - `PastoralNote`, the general
          tier NFR-PRIV-01 explicitly distinguishes from the private
          `PrayerNote` model (`ADMIN` is a hard `DENY` on both `.read`/
          `.create` for this action - Blueprint §9.3's own worked example
          - so this section never renders anything for that role). First
          web-admin surface for this model - the backend contract/RBAC
          already existed from Milestone B, unused until now. */}
      <div data-testid="person-pastoral-notes-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
            <Heading level={3}>Notes</Heading>
            {!noteFormOpen && (
              <Button variant="secondary" size="sm" onClick={openNote} accessibilityLabel="Add a note for this Person">
                + Add note
              </Button>
            )}
          </div>

          {noteFormOpen && (
            <Card padding={4} testId="pastoral-note-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <Input label="Note" value={noteContent} onChange={(event) => setNoteContent(event.target.value)} placeholder="A brief operational note about this Person" testId="pastoral-note-content" />
                {noteError && (
                  <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                    {noteError}
                  </Text>
                )}
                <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                  <Button variant="primary" size="sm" disabled={!noteContent.trim()} loading={noteSubmitting} onClick={() => void submitNote()} testId="pastoral-note-submit">
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancelNote}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {pastoralNotesState.status === 'loading' && <Skeleton height={20} />}
          {pastoralNotesState.status === 'error' && <ErrorState title="Couldn't load Notes" onRetry={pastoralNotesState.refetch} />}
          {pastoralNotesState.status === 'success' && (
            pastoralNotesState.data.length === 0 ? (
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                No notes yet.
              </Text>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="pastoral-notes-list">
                {pastoralNotesState.data.map((note) => (
                  <div key={note.id} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}`, paddingBottom: theme.spacing[3] }}>
                    <Text variant="bodySmall">{note.content}</Text>
                    <Text variant="caption" color={theme.colors.text.secondary}>
                      {formatDate(note.createdAt)}
                    </Text>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
          Prayer Notes - the private, author-only pastoral domain. Gated
          behind `canSeePrivatePastoralTools`, not `canSeePastoralCareTab` -
          `BACENTA_LEADER`/`BASONTA_LEADER` see the Follow-ups/Notes
          sections above but never this one. What renders here is only
          ever the acting pastor's own notes - `usePrayerNotes` already
          returns a server-side author-filtered list, so there is nothing
          for this component to additionally filter or hide. */}
      {canSeePrivatePastoralTools && (
        <div data-testid="person-prayer-notes-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
              <Heading level={3}>Prayer Notes</Heading>
              {!prayerNoteFormOpen && (
                <Button variant="secondary" size="sm" onClick={openPrayerNote} accessibilityLabel="Add a Prayer note for this Person">
                  + Add Prayer note
                </Button>
              )}
            </div>
            <Text variant="caption" color={theme.colors.text.secondary}>
              Private and author-only - visible only to you, never to another pastor.
            </Text>

            {prayerNoteFormOpen && (
              <Card padding={4} testId="prayer-note-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  <Input label="Prayer note" value={prayerNoteContent} onChange={(event) => setPrayerNoteContent(event.target.value)} placeholder="A private prayer note about this Person" testId="prayer-note-content" />
                  <Input
                    label="Follow-up date (optional)"
                    type="date"
                    value={prayerNoteFollowUpDate}
                    onChange={(event) => setPrayerNoteFollowUpDate(event.target.value)}
                    testId="prayer-note-follow-up-date"
                  />
                  {prayerNoteError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {prayerNoteError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button variant="primary" size="sm" disabled={!prayerNoteContent.trim()} loading={prayerNoteSubmitting} onClick={() => void submitPrayerNote()} testId="prayer-note-submit">
                      Save
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelPrayerNote}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {prayerNotesState.status === 'loading' && <Skeleton height={20} />}
            {prayerNotesState.status === 'error' && <ErrorState title="Couldn't load Prayer notes" onRetry={prayerNotesState.refetch} />}
            {prayerNotesState.status === 'success' && (
              prayerNotesState.data.length === 0 ? (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  No Prayer notes yet.
                </Text>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="prayer-notes-list">
                  {prayerNotesState.data.map((note) => (
                    <div key={note.id} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}`, paddingBottom: theme.spacing[3] }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                        <Text variant="bodySmall">{note.content}</Text>
                        <Badge status={note.status === 'OPEN' ? 'warning' : 'success'}>{note.status === 'OPEN' ? 'Open' : 'Resolved'}</Badge>
                      </div>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {formatDate(note.createdAt)}
                        {note.followUpDate ? ` · Follow up ${formatDate(note.followUpDate)}` : ''}
                      </Text>
                      {note.status === 'OPEN' && (
                        <Button variant="tertiary" size="sm" loading={resolvingPrayerNoteId === note.id} onClick={() => void resolvePrayerNote(note.id)}>
                          Mark resolved
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
          Counselling - pastor-only, organizational scope (not author-only,
          unlike Prayer Notes just above - see `useCounsellingSessions`'s
          own doc comment). */}
      {canSeePrivatePastoralTools && (
        <div data-testid="person-counselling-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
              <Heading level={3}>Counselling</Heading>
              {!counsellingFormOpen && (
                <Button variant="secondary" size="sm" onClick={openCounselling} accessibilityLabel="Schedule a Counselling session for this Person">
                  + Schedule session
                </Button>
              )}
            </div>

            {counsellingFormOpen && (
              <Card padding={4} testId="counselling-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  <Input label="Scheduled for" type="datetime-local" value={counsellingScheduledAt} onChange={(event) => setCounsellingScheduledAt(event.target.value)} testId="counselling-scheduled-at" />
                  <Input label="Brief note (optional)" value={counsellingBriefNote} onChange={(event) => setCounsellingBriefNote(event.target.value)} placeholder="What this session is about" testId="counselling-brief-note" />
                  {counsellingError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {counsellingError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button variant="primary" size="sm" disabled={!counsellingScheduledAt} loading={counsellingSubmitting} onClick={() => void submitCounselling()} testId="counselling-submit">
                      Schedule
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelCounselling}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {counsellingSessionsState.status === 'loading' && <Skeleton height={20} />}
            {counsellingSessionsState.status === 'error' && <ErrorState title="Couldn't load Counselling sessions" onRetry={counsellingSessionsState.refetch} />}
            {counsellingSessionsState.status === 'success' && (
              counsellingSessionsState.data.length === 0 ? (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  No Counselling sessions yet.
                </Text>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="counselling-sessions-list">
                  {counsellingSessionsState.data.map((session) => (
                    <div key={session.id} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}`, paddingBottom: theme.spacing[3] }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[2] }}>
                        <Text variant="bodySmall">{formatDate(session.scheduledAt)}{session.briefNote ? ` — ${session.briefNote}` : ''}</Text>
                        <Badge status={session.status === 'SCHEDULED' ? 'info' : session.status === 'COMPLETED' ? 'success' : 'neutral'}>
                          {session.status === 'SCHEDULED' ? 'Scheduled' : session.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
                        </Badge>
                      </div>
                      {session.status === 'SCHEDULED' && (
                        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                          <Button variant="tertiary" size="sm" loading={updatingSessionId === session.id} onClick={() => void updateCounsellingStatus(session.id, 'COMPLETED')}>
                            Mark completed
                          </Button>
                          <Button variant="tertiary" size="sm" loading={updatingSessionId === session.id} onClick={() => void updateCounsellingStatus(session.id, 'CANCELLED')}>
                            Cancel session
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* `[Milestone D — Portal Experiences, Portal 5: Resident Pastor]`
          Member Interactions - pastor-only, organizational scope,
          immutable once logged (no update/delete route exists - see
          `createMemberInteraction`'s own doc comment). */}
      {canSeePrivatePastoralTools && (
        <div data-testid="person-interactions-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
              <Heading level={3}>Interactions</Heading>
              {!interactionFormOpen && (
                <Button variant="secondary" size="sm" onClick={openInteraction} accessibilityLabel="Log an Interaction for this Person">
                  + Log interaction
                </Button>
              )}
            </div>

            {interactionFormOpen && (
              <Card padding={4} testId="interaction-form">
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                  <Select
                    label="Type"
                    placeholder="Select a type…"
                    value={interactionType}
                    onChange={(event) => setInteractionType(event.target.value as MemberInteractionTypeDto)}
                    options={MEMBER_INTERACTION_TYPE_OPTIONS}
                    testId="interaction-type"
                  />
                  <Input label="Occurred at" type="datetime-local" value={interactionOccurredAt} onChange={(event) => setInteractionOccurredAt(event.target.value)} testId="interaction-occurred-at" />
                  <Input label="Brief note (optional)" value={interactionBriefNote} onChange={(event) => setInteractionBriefNote(event.target.value)} placeholder="What happened" testId="interaction-brief-note" />
                  {interactionError && (
                    <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                      {interactionError}
                    </Text>
                  )}
                  <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                    <Button variant="primary" size="sm" disabled={!interactionType || !interactionOccurredAt} loading={interactionSubmitting} onClick={() => void submitInteraction()} testId="interaction-submit">
                      Log interaction
                    </Button>
                    <Button variant="secondary" size="sm" onClick={cancelInteraction}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {memberInteractionsState.status === 'loading' && <Skeleton height={20} />}
            {memberInteractionsState.status === 'error' && <ErrorState title="Couldn't load Interactions" onRetry={memberInteractionsState.refetch} />}
            {memberInteractionsState.status === 'success' && (
              memberInteractionsState.data.length === 0 ? (
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  No Interactions logged yet.
                </Text>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="interactions-list">
                  {memberInteractionsState.data.map((interaction) => (
                    <div key={interaction.id} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}`, paddingBottom: theme.spacing[3] }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                        <Badge status="neutral">{MEMBER_INTERACTION_TYPE_LABEL[interaction.type]}</Badge>
                        <Text variant="bodySmall">{formatDate(interaction.occurredAt)}</Text>
                      </div>
                      {interaction.briefNote && (
                        <Text variant="bodySmall" color={theme.colors.text.secondary}>
                          {interaction.briefNote}
                        </Text>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'groups', label: 'Groups', content: groupsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
    // `[Branch Pastor portal, Pastoral Care sprint]` Restricted to the
    // roles that actually hold `pastoral_care.followup_task.read`/
    // `pastoral_care.notes.read` at a real scope - see
    // `canSeePastoralCareTab`'s own doc comment above. Every other role
    // keeps the exact three tabs this page has always had
    // (`Overview`/`Groups`/`Roles`), unaffected.
    ...(canSeePastoralCareTab ? [{ id: 'pastoral-care', label: 'Pastoral Care', content: pastoralCareContent }] : []),
  ];

  return (
    // `[Whole Ecclesia layout rebalance]` Width/centering now lives with
    // the caller (`PersonPage.tsx` wraps this in `PageContainer` for the
    // standalone route; `BranchPeopleWorkspace` renders this raw inside
    // its own `Drawer`, which owns a narrower width itself) - this
    // component no longer sets its own `maxWidth`, so it's correct in
    // both contexts rather than fighting whichever container it's in.
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
      <Card padding={6} testId="person-detail-card">
        <Tabs testId="person-detail-tabs" tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />
      </Card>
    </div>
  );
}
