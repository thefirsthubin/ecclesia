import { useState } from 'react';
import { Avatar, Badge, Button, Card, ErrorState, Heading, Icon, Input, RecordPicker, Select, Skeleton, Table, Tabs, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn, TabItem } from '@ecclesia/ui-web';
import { ROLE_VALUES } from '@ecclesia/contracts';
import type { GroupMembershipResponseDto, LifecycleStageDto, RoleAssignmentResponseDto, RoleDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { useParams } from '../../router/router';
import { roleLabel } from '../../shell/nav-items';
import { createFollowUpTask, searchPeopleForEscalation } from '../PastoralCare/usePastoralCareData';
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

  const overviewContent = (
    <div data-testid="person-profile-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4] }}>
        <Avatar name={`${person.firstName} ${person.lastName}`} size="md" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <Heading level={1}>{`${person.firstName} ${person.lastName}`}</Heading>
          {/* `[UX Design Implementation]` Final UX Design Specification §19
              (Phase 3 People workflow UI) - this previously hardcoded
              `status="success"` regardless of the Person's real stage, so
              e.g. a Lapsed Person's own profile showed a green "on track"
              badge. Now the same `LIFECYCLE_BADGE_STATUS` mapping
              `PeopleListPage.tsx` already uses. */}
          <Badge status={LIFECYCLE_BADGE_STATUS[person.lifecycleStage]}>{LIFECYCLE_LABEL[person.lifecycleStage] ?? person.lifecycleStage}</Badge>
        </div>
      </div>
      {/* `[UX Design Implementation]` Final UX Design Specification §19
          (Phase 3 People workflow UI) - icon-labeled rows replace three
          unlabeled lines of text that were only distinguishable by their
          "No X on file" fallback copy. Same fields, same values, no new
          data - purely a scannability improvement. */}
      <div style={{ marginTop: theme.spacing[4], display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icon name="phone" size="sm" color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.phone ?? 'No phone on file'}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icon name="mail" size="sm" color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.email ?? 'No email on file'}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Icon name="mapPin" size="sm" color={theme.colors.text.secondary} />
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            {person.address ?? 'No address on file'}
          </Text>
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

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview', content: overviewContent },
    { id: 'groups', label: 'Groups', content: groupsContent },
    { id: 'roles', label: 'Roles', content: rolesContent },
  ];

  return (
    // `[UX Design Implementation]` Final UX Design Specification §19
    // (Phase 3 People workflow UI) - widened from 640 to 800. The Groups/
    // Roles tabs' new Table layout (§9 adoption) needs more horizontal
    // room to read as a real table rather than a cramped one; the
    // Overview tab's profile content still reads fine at this width, it
    // simply doesn't use all of it.
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4], maxWidth: 800 }}>
      <Card padding={6} testId="person-detail-card">
        <Tabs testId="person-detail-tabs" tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} />
      </Card>
    </div>
  );
}
