import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, Divider, EmptyState, ErrorState, Heading, Input, RadioGroup, Skeleton, Text, useTheme } from '@ecclesia/ui-native';

import { useMinistrySession } from '../../lib/session';
import { createMinistryEvent, useMinistryEvents } from '../MinistryDashboard/hooks/useMinistryData';

const EVENT_TYPE_OPTIONS = [
  { value: 'MINISTRY_MEETING', label: 'Ministry Meeting' },
  { value: 'REHEARSAL', label: 'Rehearsal' },
  { value: 'OUTREACH', label: 'Outreach' },
];

/**
 * Ministry Leader Events — the milestone brief's third tab for this
 * persona. Reuses `GET/POST /gatherings` unmodified (`ownerGroupId` scoped
 * to this Basonta), the same "Gathering" entity every other Events
 * concept in this codebase already models onto — there is no separate
 * "Event" schema (see `useMinistryData.ts`'s own doc comment and
 * `MOBILE_PERSONAS_DESIGN_NOTES.md` for the full "Basonta Event = a
 * Gathering with `ownerGroupId` set to this Basonta's id" reasoning, and
 * this sprint's `permission-matrix.ts` read-permission fix that makes the
 * list half of this screen possible at all).
 *
 * `[Known limitation]` `scheduledStart` is a plain text `Input`, not a
 * native date/time picker — no such component exists anywhere in
 * `@ecclesia/ui-native` yet (`OfferingRecordingScreen`'s own amount entry
 * is the closest precedent for "no dedicated input widget, use a plain
 * `Input` with format guidance instead"), and building one is a Design
 * System component addition outside this milestone's "reuse existing
 * components" instruction. A malformed value fails fast with the API's
 * own validation error surfaced in `submitError`, the same "let the
 * server be the source of truth for correctness" approach this app
 * already takes for other free-text fields.
 */
export function MinistryEventsScreen() {
  const theme = useTheme();
  const session = useMinistrySession();
  const eventsState = useMinistryEvents();

  const [type, setType] = useState('MINISTRY_MEETING');
  const [scheduledStart, setScheduledStart] = useState('');
  const [venue, setVenue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      const isoStart = new Date(scheduledStart).toISOString();
      await createMinistryEvent(session.authToken, session.basontaGroupId, { type, scheduledStart: isoStart, venue: venue.trim() || undefined });
      setScheduledStart('');
      setVenue('');
      setShowForm(false);
      eventsState.refetch();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Something went wrong scheduling this Event.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Heading level={1}>Events</Heading>
        <Button variant="secondary" size="sm" onPress={() => setShowForm((value) => !value)} testId="ministry-events-toggle-form">
          {showForm ? 'Cancel' : 'New Event'}
        </Button>
      </View>

      {showForm && (
        <View style={{ gap: theme.spacing[3] }}>
          <RadioGroup label="Type" options={EVENT_TYPE_OPTIONS} value={type} onChange={setType} testId="ministry-events-type" />
          <Input
            label="Starts at"
            value={scheduledStart}
            onChangeText={setScheduledStart}
            placeholder="2026-08-10T18:00"
            testId="ministry-events-scheduled-start"
          />
          <Input label="Venue (optional)" value={venue} onChangeText={setVenue} placeholder="Main Hall" testId="ministry-events-venue" />
          {submitError && (
            <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
              {submitError}
            </Text>
          )}
          <Button loading={submitting} disabled={scheduledStart.length === 0} onPress={() => void submit()} testId="ministry-events-submit">
            Schedule Event
          </Button>
        </View>
      )}

      {eventsState.status === 'loading' && (
        <View style={{ gap: theme.spacing[3] }}>
          <Skeleton height={64} radius="md" />
          <Skeleton height={64} radius="md" />
        </View>
      )}

      {eventsState.status === 'error' && (
        <ErrorState title="Couldn't load your Events" description={eventsState.error.message} onRetry={eventsState.refetch} testId="ministry-events-error" />
      )}

      {eventsState.status === 'success' &&
        (eventsState.data.length === 0 ? (
          <EmptyState icon="calendar" title="No Events scheduled" description="Nothing scheduled for your Basonta right now." />
        ) : (
          <View style={{ gap: theme.spacing[3] }}>
            {eventsState.data.map((event, index) => (
              <View key={event.id}>
                {index > 0 && <Divider />}
                <View style={{ gap: theme.spacing[1], paddingTop: index > 0 ? theme.spacing[3] : 0 }} testID={`ministry-event-row-${event.id}`}>
                  <Text variant="body">{event.type}</Text>
                  <Text variant="bodySmall" color={theme.colors.text.secondary}>
                    {new Date(event.scheduledStart).toLocaleString()}
                    {event.venue ? ` · ${event.venue}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}
