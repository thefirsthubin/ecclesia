import { useCallback, useState } from 'react';
import type { VisitorIntakeResponseDto } from '@ecclesia/contracts';
import type { RecordOption } from '@ecclesia/ui-native';

import { useActorSession } from '../../../lib/session';
import { submitVisitorIntake, useTodayGathering } from '../../UsherDashboard/hooks/useUsherData';

export interface UseVisitorIntakeDataResult {
  firstName: string;
  setFirstName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  howTheyHeard: string;
  setHowTheyHeard: (value: string) => void;
  firstTimeGuest: boolean;
  setFirstTimeGuest: (value: boolean) => void;
  bacentaPreference: RecordOption | null;
  setBacentaPreference: (value: RecordOption | null) => void;
  canSubmit: boolean;
  submitting: boolean;
  submitError: string | undefined;
  lastSubmission: VisitorIntakeResponseDto | undefined;
  submit: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Data + submit orchestration for the Visitor Intake screen
 * (`USHER_ROLE_PROPOSAL.md` §6, US-A1/FR-GTH-04). `POST /visitor-intake`
 * (`submitVisitorIntake`, `useUsherData.ts`) is this app's - and this
 * codebase's - first frontend consumer of that endpoint; it has existed,
 * backend-only, since the Gatherings sprint (`GATHERINGS_DESIGN_NOTES.md`).
 *
 * `gatheringId` is attached from `useTodayGathering()` when one is found,
 * but submission is never blocked on it - `submitVisitorIntakeSchema`'s
 * own `gatheringId` field is optional, and a guest's details shouldn't be
 * lost just because no Gathering row happens to match today
 * (`VisitorIntakeService.submit` still creates the Person and, when a
 * Bacenta preference resolves to an active Shepherd, the Follow-up task -
 * both independent of `gatheringId`).
 *
 * No client-side duplicate-candidate handling (`PEOPLE_INTAKE_DESIGN_NOTES.md`
 * §2's "View this person / Create anyway" review modal) - `[Known
 * limitation, Usher role milestone]` a 409 from `PersonService.create`'s
 * own duplicate check (run internally by `VisitorIntakeService.submit`,
 * unconditionally) surfaces here only as a plain `submitError` string, the
 * same "server is the source of truth, no client-side re-implementation"
 * fallback `MinistryEventsScreen`'s date validation already established.
 * Building the fuller review-and-resolve flow `NewPersonForm.tsx` has for
 * `POST /people` directly is a real, disclosed gap, not silently missing -
 * out of scope for this milestone's Dashboard/Attendance/Visitor-Intake
 * brief.
 */
export function useVisitorIntakeData(): UseVisitorIntakeDataResult {
  const session = useActorSession();
  const gatheringState = useTodayGathering();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [howTheyHeard, setHowTheyHeard] = useState('');
  const [firstTimeGuest, setFirstTimeGuest] = useState(false);
  const [bacentaPreference, setBacentaPreference] = useState<RecordOption | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [lastSubmission, setLastSubmission] = useState<VisitorIntakeResponseDto | undefined>(undefined);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const reset = useCallback(() => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setHowTheyHeard('');
    setFirstTimeGuest(false);
    setBacentaPreference(null);
    setSubmitError(undefined);
    setLastSubmission(undefined);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!canSubmit) {
      setSubmitError('First and last name are required.');
      return false;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const gatheringId = gatheringState.status === 'success' ? gatheringState.data?.id : undefined;
      const submission = await submitVisitorIntake(session.authToken, {
        gatheringId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        howTheyHeard: howTheyHeard.trim() || undefined,
        firstTimeGuest,
        bacentaPreferenceGroupId: bacentaPreference?.id,
      });
      setLastSubmission(submission);
      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong submitting this form.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, gatheringState, firstName, lastName, phone, howTheyHeard, firstTimeGuest, bacentaPreference, session.authToken]);

  return {
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    howTheyHeard,
    setHowTheyHeard,
    firstTimeGuest,
    setFirstTimeGuest,
    bacentaPreference,
    setBacentaPreference,
    canSubmit,
    submitting,
    submitError,
    lastSubmission,
    submit,
    reset,
  };
}
