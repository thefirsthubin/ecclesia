import { useState } from 'react';
import { Badge, Button, Card, ErrorState, Input, SectionHeader, Select, Skeleton, Text, useTheme, useToast } from '@ecclesia/ui-web';
import { POTENTIAL_SOURCE_VALUES } from '@ecclesia/contracts';
import type { PotentialResponseDto, PotentialSourceDto, PotentialStatusDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { createPotential, resolveDefaultPotentialsQuery, updatePotential, usePotentialsList, usePotentialsListForGroups } from './usePotentialsData';

const SOURCE_OPTIONS = POTENTIAL_SOURCE_VALUES.map((value) => ({ value, label: value.charAt(0) + value.slice(1).toLowerCase().replace('_', ' ') }));
const STATUS_BADGE: Record<PotentialStatusDto, 'info' | 'warning' | 'success' | 'neutral'> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  CONVERTED: 'success',
  CLOSED: 'neutral',
};

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * `[Post-Milestone D — Portal Experiences follow-up]` The real Potentials
 * pipeline for `PeopleListWorkspace`'s three roles - a genuine gap found
 * during Milestone D's own D11 audit: `ASSISTANT_PASTOR`/`BACENTA_LEADER`/
 * `BASONTA_LEADER` all hold a working `people.potential.*` grant
 * (traced against `permission-matrix.ts`) but the Potentials pipeline
 * only had a web-admin surface on `PeopleDirectoryPage`
 * (`ADMIN`/`RESIDENT_PASTOR`/`ACTING_RESIDENT_PASTOR`). `ASSISTANT_PASTOR`
 * fans out across every Bacenta in `clusterBacentaIds` (the same
 * `usePotentialsListForGroups` pattern `OutreachPage`/Pastoral Care's own
 * queues already establish for the identical CLUSTER-spans-several-groups
 * mismatch); `BACENTA_LEADER`/`BASONTA_LEADER` are single-group
 * (`usePotentialsList`). No "promote to Person" action here, unlike
 * Outreach contacts - `updatePotentialSchema` supports linking a
 * `personId` after the fact, but the normal "+ New Person" flow already
 * covers creating the real record; this section's own job is triage
 * (status/notes), matching `updatePotentialSchema`'s own "narrow,
 * triage-only" doc comment.
 */
export function PotentialsSection() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<PotentialSourceDto | ''>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (state.status !== 'authenticated') return null;

  const isClusterRole = state.actor.role === 'ASSISTANT_PASTOR';
  const clusterBacentaIds = state.actor.clusterBacentaIds ?? [];
  const query = resolveDefaultPotentialsQuery(state.actor);
  const singleGroupState = usePotentialsList(isClusterRole ? undefined : state.accessToken, query);
  const clusterState = usePotentialsListForGroups(isClusterRole ? state.accessToken : undefined, clusterBacentaIds);
  const potentialsState = isClusterRole ? clusterState : singleGroupState;

  const openForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setSource('');
    setNotes('');
    setSubmitError(undefined);
    setFormOpen(true);
  };
  const cancelForm = () => {
    setFormOpen(false);
    setSubmitError(undefined);
  };
  const submitCreate = async () => {
    if (!firstName.trim() || !source) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await createPotential(state.accessToken, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        source,
        notes: notes.trim() || undefined,
      });
      toast.show({ status: 'success', message: 'Potential added.' });
      setFormOpen(false);
      potentialsState.refetch();
    } catch (error) {
      setSubmitError(extractErrorMessage(error, 'Something went wrong adding this Potential.'));
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (potentialId: string, status: PotentialStatusDto) => {
    setUpdatingId(potentialId);
    try {
      await updatePotential(state.accessToken, potentialId, { status });
      potentialsState.refetch();
    } catch (error) {
      toast.show({ status: 'danger', message: extractErrorMessage(error, 'Something went wrong updating this Potential.') });
    } finally {
      setUpdatingId(null);
    }
  };

  const potentialRow = (potential: PotentialResponseDto) => (
    <div key={potential.id} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}`, paddingBottom: theme.spacing[3] }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.spacing[2] }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[1] }}>
          <Text variant="bodySmall">{`${potential.firstName}${potential.lastName ? ` ${potential.lastName}` : ''}`}</Text>
          <Text variant="caption" color={theme.colors.text.secondary}>
            {potential.source}
            {potential.phone ? ` · ${potential.phone}` : ''}
          </Text>
          {potential.notes && (
            <Text variant="caption" color={theme.colors.text.secondary}>
              {potential.notes}
            </Text>
          )}
        </div>
        <Badge status={STATUS_BADGE[potential.status]}>{potential.status.replace('_', ' ')}</Badge>
      </div>
      {(potential.status === 'NEW' || potential.status === 'IN_PROGRESS') && (
        <div style={{ display: 'flex', gap: theme.spacing[2], marginTop: theme.spacing[2] }}>
          {potential.status === 'NEW' && (
            <Button variant="tertiary" size="sm" loading={updatingId === potential.id} onClick={() => void setStatus(potential.id, 'IN_PROGRESS')}>
              Start follow-up
            </Button>
          )}
          <Button variant="tertiary" size="sm" loading={updatingId === potential.id} onClick={() => void setStatus(potential.id, 'CONVERTED')}>
            Mark converted
          </Button>
          <Button variant="tertiary" size="sm" loading={updatingId === potential.id} onClick={() => void setStatus(potential.id, 'CLOSED')}>
            Close
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Card padding={6} testId="potentials-section-card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[2] }}>
          <SectionHeader title="Potentials" description="People not yet formally registered - Outreach contacts, referrals, walk-ins" />
          {!formOpen && (
            <Button variant="secondary" size="sm" onClick={openForm} accessibilityLabel="Add a Potential">
              + Add Potential
            </Button>
          )}
        </div>

        {formOpen && (
          <Card padding={4} testId="potential-create-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Input label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} testId="potential-first-name" />
              <Input label="Last name (optional)" value={lastName} onChange={(event) => setLastName(event.target.value)} testId="potential-last-name" />
              <Input label="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} testId="potential-phone" />
              <Select
                label="Source"
                placeholder="Select a source…"
                value={source}
                onChange={(event) => setSource(event.target.value as PotentialSourceDto)}
                options={SOURCE_OPTIONS}
                testId="potential-source"
              />
              <Input label="Notes (optional)" value={notes} onChange={(event) => setNotes(event.target.value)} testId="potential-notes" />
              {submitError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {submitError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button variant="primary" size="sm" disabled={!firstName.trim() || !source} loading={submitting} onClick={() => void submitCreate()} testId="potential-submit">
                  Save
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelForm}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {potentialsState.status === 'loading' && <Skeleton height={20} />}
        {potentialsState.status === 'error' && <ErrorState title="Couldn't load Potentials" onRetry={potentialsState.refetch} />}
        {potentialsState.status === 'success' &&
          (potentialsState.data.length === 0 ? (
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              No open Potentials.
            </Text>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="potentials-list">
              {potentialsState.data.map(potentialRow)}
            </div>
          ))}
      </div>
    </Card>
  );
}
