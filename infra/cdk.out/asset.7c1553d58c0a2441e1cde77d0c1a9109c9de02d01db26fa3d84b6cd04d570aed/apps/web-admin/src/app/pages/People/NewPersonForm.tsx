import { useState } from 'react';
import { Button, Card, ErrorState, Input, Modal, RecordPicker, Skeleton, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption } from '@ecclesia/ui-web';
import type { DuplicateCandidateResponseDto, PersonResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from '../../router/router';
import { ApiError } from '../../lib/api-client';
import { createPerson, fetchPersonById, searchPeopleForGuardian } from './usePeopleData';

interface CandidateDetailState {
  status: 'loading' | 'success' | 'error';
  person?: PersonResponseDto;
}

/**
 * `[People Intake milestone]` `body` on a 409 from `POST /people` is
 * `{ message: string; candidates: DuplicateCandidateResponseDto[] }` (see
 * `PersonService.create`'s `ConflictException` construction) - `ApiError.body`
 * is intentionally `unknown` (see its own doc comment), so this is the one
 * place that narrows it for this endpoint. Defensive against a malformed or
 * missing `candidates` field rather than assuming the shape.
 */
function extractDuplicateCandidates(body: unknown): DuplicateCandidateResponseDto[] {
  if (!body || typeof body !== 'object' || !('candidates' in body)) {
    return [];
  }
  const candidates = (body as { candidates?: unknown }).candidates;
  return Array.isArray(candidates) ? (candidates as DuplicateCandidateResponseDto[]) : [];
}

const MATCHED_ON_LABEL: Record<DuplicateCandidateResponseDto['matchedOn'], string> = {
  NAME_AND_PHONE: 'Same name and phone number',
  NAME_AND_BACENTA_AND_APPROXIMATE_AGE: 'Same name, Bacenta, and approximate age',
};

export interface NewPersonFormProps {
  /** Called after a Person is successfully created (both the direct path
   * and the "Create anyway" override path) so the caller can refetch its
   * list. */
  onCreated: () => void;
  onCancel: () => void;
}

/**
 * FR-PPL-01 (create) + FR-PPL-02 (duplicate detection) + the 409
 * resubmission contract (`overrideDuplicateCheck`, see
 * `people.schemas.ts`'s own doc comment) - the People Intake milestone's
 * "Create Person" / "Duplicate candidate detection" / "409 duplicate
 * resolution flow" / "Candidate review" deliverables, all in one component.
 *
 * `[Design Decision]` **"Merge experience" is a candidate-review UI, not a
 * literal database merge.** No merge endpoint exists anywhere in this
 * backend (confirmed by a repo-wide search before writing this) - the
 * milestone brief's own "Do NOT change database schema" constraint rules
 * one out for this sprint even if it existed. What this component offers
 * instead, per candidate: **view the existing record** (navigate to its
 * profile, abandoning this draft - the existing Person is treated as
 * canonical) or, once every candidate has been reviewed, **create anyway**
 * (resubmits with `overrideDuplicateCheck: true`, per FR-PPL-02's own
 * resubmission contract). See `PEOPLE_INTAKE_DESIGN_NOTES.md` for the full
 * reasoning.
 *
 * This is the first real consumer of `Modal` (the candidate-review step is
 * exactly the "focused sub-task... that must complete or cancel before
 * returning to the parent screen" `Modal`'s own doc comment describes) and
 * of `Toast` (`useToast`, for the "Success feedback" deliverable - every
 * earlier sprint used inline state instead, since nothing before this
 * needed a notification that outlives the triggering UI, e.g. after the
 * form itself closes).
 */
export function NewPersonForm({ onCreated, onCancel }: NewPersonFormProps) {
  const theme = useTheme();
  const { state } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [guardian, setGuardian] = useState<RecordOption | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidateResponseDto[] | null>(null);
  const [candidateDetails, setCandidateDetails] = useState<Record<string, CandidateDetailState>>({});

  if (state.status !== 'authenticated') return null;
  const accessToken = state.accessToken;

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const loadCandidateDetail = (candidateId: string) => {
    setCandidateDetails((current) => ({ ...current, [candidateId]: { status: 'loading' } }));
    fetchPersonById(accessToken, candidateId)
      .then((person) => setCandidateDetails((current) => ({ ...current, [candidateId]: { status: 'success', person } })))
      .catch(() => setCandidateDetails((current) => ({ ...current, [candidateId]: { status: 'error' } })));
  };

  const closeCandidateReview = () => {
    setDuplicateCandidates(null);
    setCandidateDetails({});
  };

  const viewCandidate = (candidateId: string) => {
    closeCandidateReview();
    onCancel();
    navigate(`/people/${candidateId}`);
  };

  const attemptCreate = async (overrideDuplicateCheck: boolean) => {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const person = await createPerson(accessToken, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() ? phone.trim() : undefined,
        email: email.trim() ? email.trim() : undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth : undefined,
        address: address.trim() ? address.trim() : undefined,
        guardianPersonId: guardian?.id,
        overrideDuplicateCheck,
      });
      toast.show({ status: 'success', message: `${person.firstName} ${person.lastName} was added to People.` });
      closeCandidateReview();
      onCreated();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const candidates = extractDuplicateCandidates(error.body);
        if (candidates.length > 0) {
          setDuplicateCandidates(candidates);
          candidates.forEach((candidate) => loadCandidateDetail(candidate.candidateId));
          return;
        }
      }
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong creating this Person.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card padding={6} testId="new-person-form">
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <Input
          label="First name"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          testId="new-person-first-name"
        />
        <Input label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} testId="new-person-last-name" />
        <Input label="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} testId="new-person-phone" />
        <Input label="Email (optional)" value={email} onChange={(event) => setEmail(event.target.value)} testId="new-person-email" />
        <Input
          label="Date of birth (optional)"
          type="date"
          value={dateOfBirth}
          onChange={(event) => setDateOfBirth(event.target.value)}
          testId="new-person-dob"
        />
        <Input label="Address (optional)" value={address} onChange={(event) => setAddress(event.target.value)} testId="new-person-address" />
        <RecordPicker
          label="Guardian (optional)"
          value={guardian}
          onChange={setGuardian}
          onSearch={(query) => searchPeopleForGuardian(accessToken, query)}
          testId="new-person-guardian"
          helperText="Only needed for a minor with a Guardian already in People."
        />

        {submitError && (
          <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
            {submitError}
          </Text>
        )}

        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => void attemptCreate(false)}
            testId="new-person-submit"
          >
            Create Person
          </Button>
          <Button variant="tertiary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Modal
        isOpen={duplicateCandidates !== null}
        onClose={closeCandidateReview}
        title="Possible duplicate found"
        dismissible={!submitting}
        testId="duplicate-candidate-modal"
        footer={
          <>
            <Button variant="tertiary" size="sm" onClick={closeCandidateReview}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={submitting}
              onClick={() => void attemptCreate(true)}
              testId="new-person-create-anyway"
            >
              Create anyway
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            FR-PPL-02: this looks like it might already be a Person in the directory. Review the record(s) below, or create this Person
            anyway if they're genuinely different.
          </Text>
          {(duplicateCandidates ?? []).map((candidate, index) => {
            const detail = candidateDetails[candidate.candidateId];
            return (
              <div key={candidate.candidateId} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {index > 0 && <div style={{ borderTop: `1px solid ${theme.colors.border.default}` }} />}
                <Text variant="caption" color={theme.colors.text.secondary}>
                  {MATCHED_ON_LABEL[candidate.matchedOn]}
                </Text>
                {(!detail || detail.status === 'loading') && <Skeleton height={40} />}
                {detail?.status === 'error' && (
                  <ErrorState title="Couldn't load this record" onRetry={() => loadCandidateDetail(candidate.candidateId)} />
                )}
                {detail?.status === 'success' && detail.person && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing[3] }}>
                    <div>
                      <Text variant="bodySmall">{`${detail.person.firstName} ${detail.person.lastName}`}</Text>
                      <Text variant="caption" color={theme.colors.text.secondary}>
                        {detail.person.phone ?? detail.person.email ?? 'No contact info on file'}
                      </Text>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => viewCandidate(candidate.candidateId)}
                      testId={`view-candidate-${candidate.candidateId}`}
                    >
                      View this person
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </Card>
  );
}
