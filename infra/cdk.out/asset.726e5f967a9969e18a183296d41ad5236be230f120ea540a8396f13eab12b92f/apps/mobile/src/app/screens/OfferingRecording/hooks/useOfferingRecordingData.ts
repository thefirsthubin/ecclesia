import { useCallback, useState } from 'react';
import type { FinancialTransactionChannelDto, FinancialTransactionResponseDto, FinancialTransactionTypeDto } from '@ecclesia/contracts';

import { apiPost } from '../../../lib/api-client';
import { useSession } from '../../../lib/session';

/**
 * The three inbound types Release 1 scopes to Bacenta-level Shepherd
 * recording (PRD §9.2: "Offering/Tithe/Special Offering recording at
 * Bacenta level"). `recordFinancialTransactionSchema` also allows
 * `PLEDGE`/`DONATION` (§13.5's Pledge-fulfillment reuse of this same
 * endpoint - see that schema's own doc comment), but those aren't this
 * persona's job on this screen.
 */
export const OFFERING_TYPE_OPTIONS: { value: Extract<FinancialTransactionTypeDto, 'OFFERING' | 'TITHE' | 'SPECIAL_OFFERING'>; label: string }[] = [
  { value: 'OFFERING', label: 'Offering' },
  { value: 'TITHE', label: 'Tithe' },
  { value: 'SPECIAL_OFFERING', label: 'Special Offering' },
];

export const CHANNEL_OPTIONS: { value: FinancialTransactionChannelDto; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
];

/**
 * Converts a user-typed amount in major currency units (e.g. "50.5") into
 * the integer-minor-unit decimal string `recordFinancialTransactionSchema`
 * requires (`amountMinor`, e.g. "5050") - via string manipulation, never a
 * JS `number` multiplication, for the exact float-precision reason
 * `stewardship.schemas.ts`'s own doc comment gives for why `amountMinor`
 * is a decimal string on the wire at all (a `number` loses precision past
 * 2^53, and this codebase already treats that as a real constraint, not a
 * theoretical one). Returns `null` for anything that isn't a positive
 * amount with at most 2 decimal places - `amountMinorSchema` itself would
 * reject a zero-or-negative amount, but this fails fast client-side rather
 * than round-tripping to the server first.
 */
export function parseAmountToMinorUnits(raw: string): string | null {
  const trimmed = raw.trim();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(trimmed);
  if (!match) return null;
  const [, wholePart, fractionPart = ''] = match;
  const paddedFraction = fractionPart.padEnd(2, '0');
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '');
  const minorUnits = `${normalizedWhole}${paddedFraction}`.replace(/^0+(?=\d)/, '');
  return minorUnits === '0' ? null : minorUnits;
}

export interface UseOfferingRecordingDataResult {
  type: FinancialTransactionTypeDto;
  setType: (type: FinancialTransactionTypeDto) => void;
  channel: FinancialTransactionChannelDto;
  setChannel: (channel: FinancialTransactionChannelDto) => void;
  amountText: string;
  setAmountText: (value: string) => void;
  amountError: string | undefined;
  submitting: boolean;
  submitError: string | undefined;
  lastRecorded: FinancialTransactionResponseDto | undefined;
  submit: () => Promise<boolean>;
  reset: () => void;
}

/**
 * Data + submit orchestration for the Offering Recording screen. Reuses
 * `POST /financial-transactions` (`recordFinancialTransactionSchema`,
 * Stewardship module) entirely unmodified - the same "existing,
 * unmodified endpoints only" discipline `useAttendanceCaptureData.ts`
 * established. **Always sends `sourceGroupId: session.bacentaGroupId`** -
 * this is not optional in practice for this screen, even though the
 * schema field itself is optional: omitting it makes
 * `FinancialTransactionCreateResourceContextGuard` resolve the resource as
 * `{ ownerId: actor.personId }` (a personal, SELF-scoped gift), and
 * `BACENTA_LEADER` only holds `stewardship.transaction.record` at
 * `OWN_GROUP` scope, not `SELF` - a Shepherd has no personal-gift-recording
 * permission on this endpoint at all. Sending `sourceGroupId` is what
 * correctly attributes the entry as a Bacenta-collected offering, matching
 * PRD §12.7's own "source is the giving Group, not an individual" framing.
 * No client-supplied `giverPersonId` field exists on the request at all -
 * see the schema's own doc comment for why.
 */
export function useOfferingRecordingData(): UseOfferingRecordingDataResult {
  const session = useSession();
  const [type, setType] = useState<FinancialTransactionTypeDto>('OFFERING');
  const [channel, setChannel] = useState<FinancialTransactionChannelDto>('CASH');
  const [amountText, setAmountText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [lastRecorded, setLastRecorded] = useState<FinancialTransactionResponseDto | undefined>(undefined);

  const amountMinor = parseAmountToMinorUnits(amountText);
  const amountError = amountText.length > 0 && amountMinor === null ? 'Enter a valid amount greater than 0' : undefined;

  const reset = useCallback(() => {
    setAmountText('');
    setSubmitError(undefined);
    setLastRecorded(undefined);
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!amountMinor) {
      setSubmitError('Enter a valid amount greater than 0');
      return false;
    }
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const recorded = await apiPost<FinancialTransactionResponseDto>(
        '/financial-transactions',
        { type, sourceGroupId: session.bacentaGroupId, channel, amountMinor },
        { authToken: session.authToken },
      );
      setLastRecorded(recorded);
      setAmountText('');
      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong recording this offering.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [amountMinor, type, channel, session.bacentaGroupId, session.authToken]);

  return { type, setType, channel, setChannel, amountText, setAmountText, amountError, submitting, submitError, lastRecorded, submit, reset };
}
