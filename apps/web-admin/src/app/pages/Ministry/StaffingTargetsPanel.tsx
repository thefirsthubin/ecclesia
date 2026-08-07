import { useState } from 'react';
import { Badge, Button, Card, Divider, EmptyState, ErrorState, Heading, Input, RecordPicker, Select, Skeleton, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption } from '@ecclesia/ui-web';
import type { StaffingTargetResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { useGathering, useGatheringsList } from '../Gatherings/useGatheringsData';
import { assignVolunteerToGroup, searchPeopleForAssignment, setStaffingTarget, useStaffingTargets } from './useStaffingTargetsData';

type AdequacyFilter = 'all' | 'adequate' | 'understaffed';

function gatheringLabel(type: string | undefined, scheduledStart: string | undefined): string {
  if (!type) return 'Gathering';
  return scheduledStart ? `${type} — ${new Date(scheduledStart).toLocaleDateString()}` : type;
}

/** One row's Gathering label + progress bar - a separate component (not
 * inlined in `StaffingTargetsPanel`'s `.map`) so `useGathering` can be
 * called once per row, matching React's rules of hooks (a target's
 * `gatheringId` may reference a Branch-wide Gathering this Basonta
 * doesn't own, so the parent's own `ownerGroupId`-filtered Gatherings
 * list can't always resolve it). */
function StaffingTargetRow({
  target,
  accessToken,
  canEdit,
  onSaved,
}: {
  target: StaffingTargetResponseDto;
  accessToken: string;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const toast = useToast();
  const gatheringState = useGathering(accessToken, target.gatheringId);
  const [editing, setEditing] = useState(false);
  const [targetCountText, setTargetCountText] = useState(String(target.targetCount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const vacancyCount = Math.max(target.targetCount - target.rosteredCount, 0);
  const progressPercent = Math.min(100, Math.round(target.ratio * 100));

  const submitEdit = async () => {
    const parsed = Number.parseInt(targetCountText, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter a target count greater than 0');
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await setStaffingTarget(accessToken, { gatheringId: target.gatheringId, groupId: target.groupId, targetCount: parsed });
      toast.show({ status: 'success', message: 'Staffing target updated' });
      setEditing(false);
      onSaved();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong updating this target.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid={`staffing-target-row-${target.id}`}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1], flex: 1, minWidth: 0 }}>
          <Text variant="bodySmall" as="span">
            {gatheringState.status === 'success' ? gatheringLabel(gatheringState.data.type, gatheringState.data.scheduledStart) : 'Gathering'}
          </Text>
          <Text variant="caption" color={theme.colors.text.secondary}>
            {`${target.rosteredCount} of ${target.targetCount} staffed${vacancyCount > 0 ? ` · ${vacancyCount} vacant` : ''}`}
          </Text>
          <div style={{ height: 6, borderRadius: theme.radius.full, backgroundColor: theme.colors.border.subtle, overflow: 'hidden', maxWidth: 240 }}>
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                borderRadius: theme.radius.full,
                backgroundColor: target.isAdequate ? theme.colors.status.success.strong : theme.colors.status.warning.strong,
              }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <Badge status={target.isAdequate ? 'success' : 'warning'}>{target.isAdequate ? 'Adequate' : 'Understaffed'}</Badge>
          {canEdit && !editing && (
            <Button variant="tertiary" size="sm" onClick={() => setEditing(true)} accessibilityLabel={`Edit staffing target for ${target.id}`}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
          <Input
            label="Target staff"
            value={targetCountText}
            onChange={(event) => setTargetCountText(event.target.value)}
            error={error}
            testId={`staffing-target-edit-input-${target.id}`}
          />
          <Button variant="primary" size="sm" loading={saving} onClick={() => void submitEdit()} testId={`staffing-target-edit-submit-${target.id}`}>
            Save
          </Button>
          <Button variant="tertiary" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export interface StaffingTargetsPanelProps {
  groupId: string;
  /** Only `BASONTA_LEADER` holds `ministry.staffing_target.create`
   * (`permission-matrix.ts`) - callers that render this for a role which
   * only has `.read` (Resident Pastor/Admin viewing via the directory)
   * pass `canEdit={false}` so Set/Edit never render a false affordance
   * (same "don't render a button the backend will 403" precedent
   * `AlertPriorityCard`'s `readOnly` prop established). */
  canEdit: boolean;
  /** Compact mode (embedded in a persona Dashboard) hides the Search/Filter
   * row and caps the list, matching the Dashboard's own "curated density"
   * standard (Design System v1.0 Part 1.8) rather than the full Ministry
   * page's "structured density" one. */
  compact?: boolean;
}

/**
 * `[Remaining Engineering Sprint, Milestone 11]` Objective 2, the
 * Staffing Targets UI `MINISTRY_PAGE_DESIGN_NOTES.md` disclosed as
 * missing ("no 'list staffing targets for this Basonta' endpoint, no
 * Gathering picker on web-admin"). Both gaps are closed: the list
 * endpoint (`staffing-target.controller.ts`'s new `list()`), and this
 * panel's "+ Set Staffing Target" Gathering picker (`useGatheringsList`,
 * already real). Backend logic itself is unchanged beyond that one
 * additive list endpoint - `setStaffingTarget` reuses the existing
 * upsert-shaped `create` action for both "set" and "edit" (Milestone 11
 * brief: "Do NOT rewrite backend logic").
 */
export function StaffingTargetsPanel({ groupId, canEdit, compact = false }: StaffingTargetsPanelProps) {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;

  const targetsState = useStaffingTargets(accessToken, groupId);
  const gatheringsState = useGatheringsList(accessToken, { ownerGroupId: groupId });

  const [adequacyFilter, setAdequacyFilter] = useState<AdequacyFilter>('all');
  const [searchText, setSearchText] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [selectedGatheringId, setSelectedGatheringId] = useState('');
  const [newTargetCountText, setNewTargetCountText] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<RecordOption | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignError, setAssignError] = useState<string | undefined>(undefined);

  const closeForm = () => {
    setFormOpen(false);
    setSelectedGatheringId('');
    setNewTargetCountText('');
    setFormError(undefined);
  };

  const submitNewTarget = async () => {
    if (!accessToken) return;
    const parsed = Number.parseInt(newTargetCountText, 10);
    if (!selectedGatheringId) {
      setFormError('Choose a Gathering');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFormError('Enter a target count greater than 0');
      return;
    }
    setFormSubmitting(true);
    setFormError(undefined);
    try {
      await setStaffingTarget(accessToken, { gatheringId: selectedGatheringId, groupId, targetCount: parsed });
      toast.show({ status: 'success', message: 'Staffing target set' });
      closeForm();
      targetsState.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong setting this target.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const closeAssignForm = () => {
    setAssignFormOpen(false);
    setSelectedPerson(null);
    setAssignError(undefined);
  };

  const submitAssignVolunteer = async () => {
    if (!accessToken || !selectedPerson) return;
    setAssignSubmitting(true);
    setAssignError(undefined);
    try {
      await assignVolunteerToGroup(accessToken, selectedPerson.id, groupId);
      toast.show({ status: 'success', message: 'Volunteer assigned', description: `${selectedPerson.label} was added to this Basonta.` });
      closeAssignForm();
    } catch (error) {
      setAssignError(error instanceof Error ? error.message : 'Something went wrong assigning this volunteer.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const gatheringOptions =
    gatheringsState.status === 'success'
      ? gatheringsState.data.map((gathering) => ({ value: gathering.id, label: gatheringLabel(gathering.type, gathering.scheduledStart) }))
      : [];

  const visibleTargets = (targetsState.status === 'success' ? targetsState.data : [])
    .filter((target) => (adequacyFilter === 'all' ? true : adequacyFilter === 'adequate' ? target.isAdequate : !target.isAdequate))
    .slice(0, compact ? 3 : undefined);

  return (
    <Card padding={compact ? 5 : 6} testId="staffing-targets-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3], flexWrap: 'wrap' }}>
          <Heading level={3}>Staffing targets</Heading>
          <div style={{ display: 'flex', gap: theme.spacing[2] }}>
            {canEdit && !assignFormOpen && (
              <Button variant="tertiary" size="sm" onClick={() => setAssignFormOpen(true)}>
                + Assign volunteer
              </Button>
            )}
            {canEdit && !formOpen && (
              <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)} accessibilityLabel="Set a new staffing target">
                + Set target
              </Button>
            )}
          </div>
        </div>

        {assignFormOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3], padding: theme.spacing[4], borderRadius: theme.radius.md, backgroundColor: theme.colors.surface.raised }}>
            <RecordPicker
              label="Person to assign"
              placeholder="Search people by name…"
              value={selectedPerson}
              onChange={setSelectedPerson}
              onSearch={(query) => (accessToken ? searchPeopleForAssignment(accessToken, query) : Promise.resolve([]))}
              testId="assign-volunteer-picker"
            />
            {assignError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {assignError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button variant="primary" size="sm" disabled={!selectedPerson} loading={assignSubmitting} onClick={() => void submitAssignVolunteer()}>
                Assign
              </Button>
              <Button variant="tertiary" size="sm" onClick={closeAssignForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {formOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3], padding: theme.spacing[4], borderRadius: theme.radius.md, backgroundColor: theme.colors.surface.raised }}>
            <Select
              label="Gathering"
              placeholder="Select a Gathering"
              options={gatheringOptions}
              value={selectedGatheringId}
              onChange={(event) => setSelectedGatheringId(event.target.value)}
              testId="staffing-target-gathering-select"
            />
            <Input
              label="Target staff count"
              value={newTargetCountText}
              onChange={(event) => setNewTargetCountText(event.target.value)}
              placeholder="e.g. 6"
              testId="staffing-target-count-input"
            />
            {formError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {formError}
              </Text>
            )}
            <div style={{ display: 'flex', gap: theme.spacing[2] }}>
              <Button variant="primary" size="sm" loading={formSubmitting} onClick={() => void submitNewTarget()} testId="staffing-target-submit">
                Set target
              </Button>
              <Button variant="tertiary" size="sm" onClick={closeForm}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!compact && (
          <div style={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
            <Input
              label="Search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Filter by Gathering type…"
              testId="staffing-targets-search"
            />
            <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
              {(['all', 'adequate', 'understaffed'] as const).map((filterValue) => (
                <Button
                  key={filterValue}
                  variant={adequacyFilter === filterValue ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setAdequacyFilter(filterValue)}
                >
                  {filterValue === 'all' ? 'All' : filterValue === 'adequate' ? 'Adequate' : 'Understaffed'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {targetsState.status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        )}

        {targetsState.status === 'error' && <ErrorState title="Couldn't load Staffing Targets" onRetry={targetsState.refetch} />}

        {targetsState.status === 'success' && (
          visibleTargets.length === 0 ? (
            <EmptyState icon="clipboardList" title="No Staffing Targets yet" description="Set a target for an upcoming Gathering to track staffing adequacy." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              {visibleTargets
                .filter((target) => targetMatchesSearch(target, searchText, gatheringOptions))
                .map((target, index) => (
                  <div key={target.id}>
                    {index > 0 && <Divider />}
                    <div style={{ paddingTop: index > 0 ? theme.spacing[4] : 0 }}>
                      <StaffingTargetRow target={target} accessToken={accessToken ?? ''} canEdit={canEdit} onSaved={targetsState.refetch} />
                    </div>
                  </div>
                ))}
            </div>
          )
        )}
      </div>
    </Card>
  );
}

/** Client-side search over the already-fetched list - no dedicated search
 * endpoint exists (or is worth adding for a per-Basonta list this small).
 * Matches against the Gathering's own label when it's one of this
 * Basonta's own Gatherings (`gatheringOptions`, `ownerGroupId`-filtered);
 * a target referencing a Gathering this list doesn't include (e.g. a
 * Branch-wide service) always matches, since there is nothing cached here
 * to filter it against - `StaffingTargetRow`'s own `useGathering` call
 * resolves that label independently. */
function targetMatchesSearch(target: StaffingTargetResponseDto, searchText: string, gatheringOptions: { value: string; label: string }[]): boolean {
  if (!searchText.trim()) return true;
  const option = gatheringOptions.find((candidate) => candidate.value === target.gatheringId);
  if (!option) return true;
  return option.label.toLowerCase().includes(searchText.trim().toLowerCase());
}
