import { useState } from 'react';
import { Badge, Button, Card, ErrorState, Input, PageContainer, PageHeader, RecordPicker, SectionHeader, Skeleton, Table, Text, useTheme, useToast } from '@ecclesia/ui-web';
import type { RecordOption, TableColumn } from '@ecclesia/ui-web';
import type { OutreachContactOutcomeDto, OutreachContactResponseDto, OutreachResponseDto } from '@ecclesia/contracts';

import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/api-client';
import { GroupNameText } from '../People/GroupNameText';
import { PersonNameText } from '../PastoralCare/PersonNameText';
import { searchPeopleForEscalation } from '../PastoralCare/usePastoralCareData';
import {
  createOutreach,
  createOutreachContact,
  promoteOutreachContact,
  resolveDefaultOutreachQuery,
  updateOutreachContactOutcome,
  useOutreachContacts,
  useOutreachList,
  useOutreachListForGroups,
} from './useOutreachData';

const OUTCOME_LABEL: Record<OutreachContactOutcomeDto, string> = {
  NOT_INTERESTED: 'Not interested',
  FOLLOW_UP_REQUESTED: 'Follow-up requested',
  ATTENDED: 'Attended',
};

const OUTCOME_BADGE: Record<OutreachContactOutcomeDto, 'neutral' | 'info' | 'warning' | 'danger' | 'success'> = {
  NOT_INTERESTED: 'neutral',
  FOLLOW_UP_REQUESTED: 'warning',
  ATTENDED: 'success',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** Best-effort extraction of the server's actual denial/conflict reason -
 * same precedent as `GatheringsListPage.tsx`'s own `extractErrorMessage`. */
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.body && typeof error.body === 'object' && 'message' in error.body) {
    const message = (error.body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.every((entry) => typeof entry === 'string')) return message.join('; ');
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * `[Milestone D — Portal Experiences, Portal 3: Bacenta Leader]`
 * "Outreaches" - Portal 3's own explicit ask ("outreach records, date,
 * contacts, people reached, outcome, promotion status"). No web-admin
 * page existed for this domain before this milestone - the backend
 * contract/RBAC (`outreach.event.*`/`outreach.contact.*`,
 * `permission-matrix.ts`) already existed from Milestone B, unused by
 * any page until now. Shared across every role holding a real grant
 * (`BACENTA_LEADER`/`BASONTA_LEADER` OWN_GROUP, `ASSISTANT_PASTOR`
 * CLUSTER, `RESIDENT_PASTOR` COUNCIL read-only), matching the exact
 * `resolveDefault*Query` + optional cluster fan-out shape every other
 * domain in this app already establishes (`People`/`Pastoral Care`/
 * `Gatherings`).
 *
 * Real data throughout - each Outreach row expands into its own real
 * Contacts list (`GET /outreach/:id/contacts`), never fetched until that
 * row is opened. "Promotion status" is the contact's own `personId`
 * (`null` = not yet promoted, a real id = promoted - `PersonNameText`
 * resolves and links it) - never a fabricated status field.
 */
export function OutreachPage() {
  const theme = useTheme();
  const toast = useToast();
  const { state } = useAuth();
  const [expandedOutreachId, setExpandedOutreachId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupTarget, setCreateGroupTarget] = useState<RecordOption | null>(null);
  const [createOccurredAt, setCreateOccurredAt] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createLeader, setCreateLeader] = useState<RecordOption | null>(null);
  const [createNotes, setCreateNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | undefined>(undefined);

  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactFirstName, setContactFirstName] = useState('');
  const [contactLastName, setContactLastName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | undefined>(undefined);

  const [outcomeBusyId, setOutcomeBusyId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promoteLastName, setPromoteLastName] = useState('');
  const [promoteSubmitting, setPromoteSubmitting] = useState(false);
  const [promoteError, setPromoteError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  // `[Branch Pastor portal precedent]` Same "compute both, activate one"
  // shape `PeopleListPage.tsx`/`FollowUpTaskQueuePage.tsx` already
  // establish for `ASSISTANT_PASTOR`'s real CLUSTER grant.
  const isClusterRole = state.actor.role === 'ASSISTANT_PASTOR';
  const clusterBacentaIds = state.actor.clusterBacentaIds ?? [];
  const query = resolveDefaultOutreachQuery(state.actor);
  const singleGroupState = useOutreachList(isClusterRole ? undefined : state.accessToken, query);
  const clusterState = useOutreachListForGroups(isClusterRole ? state.accessToken : undefined, clusterBacentaIds);
  const outreachState = isClusterRole ? clusterState : singleGroupState;

  const contactsState = useOutreachContacts(state.accessToken, expandedOutreachId);

  // `[Milestone D]` Only `BACENTA_LEADER`/`BASONTA_LEADER`/`ASSISTANT_PASTOR`
  // hold `outreach.event.create` at all (traced against
  // `permission-matrix.ts` - `RESIDENT_PASTOR` is read-only Council
  // oversight, `ADMIN` holds no grant). Gated client-side the same way
  // `PeopleListPage.tsx`'s own `CAN_CREATE_PERSON_ROLES` is - a role with
  // zero chance of success seeing "+ Record Outreach" is UI noise, not a
  // deferred authorization decision.
  const canCreateOutreach = ['BACENTA_LEADER', 'BASONTA_LEADER', 'ASSISTANT_PASTOR'].includes(state.actor.role);

  const openCreate = () => {
    setCreateGroupTarget(null);
    setCreateOccurredAt('');
    setCreateLocation('');
    setCreateLeader(null);
    setCreateNotes('');
    setCreateError(undefined);
    setCreateOpen(true);
  };
  const cancelCreate = () => {
    setCreateOpen(false);
    setCreateError(undefined);
  };
  const submitCreate = async () => {
    if (!createOccurredAt || !createLeader) return;
    setCreateSubmitting(true);
    setCreateError(undefined);
    try {
      await createOutreach(state.accessToken, {
        groupId: createGroupTarget?.id,
        occurredAt: new Date(createOccurredAt).toISOString(),
        location: createLocation.trim() || undefined,
        leaderPersonId: createLeader.id,
        notes: createNotes.trim() || undefined,
      });
      outreachState.refetch();
      setCreateOpen(false);
    } catch (error) {
      setCreateError(extractErrorMessage(error, 'Something went wrong recording this Outreach.'));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const toggleExpanded = (outreachId: string) => {
    setExpandedOutreachId((current) => (current === outreachId ? null : outreachId));
    setContactFormOpen(false);
    setPromotingId(null);
  };

  const openContactForm = () => {
    setContactFirstName('');
    setContactLastName('');
    setContactPhone('');
    setContactError(undefined);
    setContactFormOpen(true);
  };
  const submitContact = async () => {
    if (!expandedOutreachId || !contactFirstName.trim()) return;
    setContactSubmitting(true);
    setContactError(undefined);
    try {
      await createOutreachContact(state.accessToken, expandedOutreachId, {
        firstName: contactFirstName.trim(),
        lastName: contactLastName.trim() || undefined,
        phone: contactPhone.trim() || undefined,
      });
      contactsState.refetch();
      setContactFormOpen(false);
    } catch (error) {
      setContactError(extractErrorMessage(error, 'Something went wrong recording this contact.'));
    } finally {
      setContactSubmitting(false);
    }
  };

  const setOutcome = async (contactId: string, outcome: OutreachContactOutcomeDto) => {
    setOutcomeBusyId(contactId);
    try {
      await updateOutreachContactOutcome(state.accessToken, contactId, { outcome });
      contactsState.refetch();
      toast.show({ status: 'success', message: `Outcome set to ${OUTCOME_LABEL[outcome]}.` });
    } catch (error) {
      toast.show({ status: 'danger', message: extractErrorMessage(error, 'Something went wrong updating this outcome.') });
    } finally {
      setOutcomeBusyId(null);
    }
  };

  const openPromote = (contactId: string) => {
    setPromotingId(contactId);
    setPromoteLastName('');
    setPromoteError(undefined);
  };
  const cancelPromote = () => {
    setPromotingId(null);
    setPromoteError(undefined);
  };
  const submitPromote = async (contactId: string) => {
    setPromoteSubmitting(true);
    setPromoteError(undefined);
    try {
      await promoteOutreachContact(state.accessToken, contactId, { lastName: promoteLastName.trim() || undefined, overrideDuplicateCheck: false });
      contactsState.refetch();
      toast.show({ status: 'success', message: 'Contact promoted to a Person record.' });
      setPromotingId(null);
    } catch (error) {
      setPromoteError(extractErrorMessage(error, 'Something went wrong promoting this contact.'));
    } finally {
      setPromoteSubmitting(false);
    }
  };

  const columns: TableColumn<OutreachResponseDto>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (outreach) => <Text variant="bodySmall">{formatDate(outreach.occurredAt)}</Text>,
    },
    {
      key: 'group',
      header: 'Group',
      render: (outreach) =>
        outreach.groupId ? (
          <GroupNameText groupId={outreach.groupId} />
        ) : (
          <Text variant="bodySmall" color={theme.colors.text.secondary}>
            Branch-wide
          </Text>
        ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (outreach) => (
        <Text variant="bodySmall" color={outreach.location ? undefined : theme.colors.text.secondary}>
          {outreach.location ?? '—'}
        </Text>
      ),
    },
    {
      key: 'leader',
      header: 'Leader',
      render: (outreach) => <PersonNameText personId={outreach.leaderPersonId} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (outreach) => (
        <Button variant="secondary" size="sm" onClick={() => toggleExpanded(outreach.id)} accessibilityLabel={`${expandedOutreachId === outreach.id ? 'Hide' : 'View'} contacts for this Outreach`}>
          {expandedOutreachId === outreach.id ? 'Hide contacts' : 'View contacts'}
        </Button>
      ),
    },
  ];

  const contactColumns: TableColumn<OutreachContactResponseDto>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (contact) => <Text variant="bodySmall">{`${contact.firstName}${contact.lastName ? ` ${contact.lastName}` : ''}`}</Text>,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (contact) => (
        <Text variant="bodySmall" color={contact.phone ? undefined : theme.colors.text.secondary}>
          {contact.phone ?? '—'}
        </Text>
      ),
    },
    {
      key: 'outcome',
      header: 'Outcome',
      render: (contact) => (contact.outcome ? <Badge status={OUTCOME_BADGE[contact.outcome]}>{OUTCOME_LABEL[contact.outcome]}</Badge> : <Text variant="bodySmall" color={theme.colors.text.secondary}>Not yet recorded</Text>),
    },
    {
      key: 'promotion',
      header: 'Promotion status',
      render: (contact) =>
        contact.personId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
            <Badge status="success">Promoted</Badge>
            <PersonNameText personId={contact.personId} />
          </div>
        ) : (
          <Badge status="neutral">Not promoted</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (contact) => (
        <div style={{ display: 'flex', gap: theme.spacing[2], justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {!contact.outcome && (
            <Button
              variant="secondary"
              size="sm"
              loading={outcomeBusyId === contact.id}
              onClick={() => void setOutcome(contact.id, 'ATTENDED')}
              accessibilityLabel={`Mark ${contact.firstName} as Attended`}
            >
              Mark Attended
            </Button>
          )}
          {!contact.personId && (
            <Button variant="secondary" size="sm" onClick={() => openPromote(contact.id)} accessibilityLabel={`Promote ${contact.firstName} to a Person record`}>
              Promote
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer maxWidth={1120}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <PageHeader
          title="Outreaches"
          action={
            canCreateOutreach && !createOpen ? (
              <Button variant="secondary" size="sm" onClick={openCreate} accessibilityLabel="Record a new Outreach">
                + Record Outreach
              </Button>
            ) : undefined
          }
        />

        {createOpen && (
          <Card padding={6} testId="outreach-create-form">
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Input label="Date" type="datetime-local" value={createOccurredAt} onChange={(event) => setCreateOccurredAt(event.target.value)} testId="outreach-create-occurred-at" />
              <Input label="Location (optional)" value={createLocation} onChange={(event) => setCreateLocation(event.target.value)} placeholder="e.g. Osu Estate" />
              <RecordPicker
                label="Leader"
                placeholder="Search for who led this Outreach…"
                value={createLeader}
                onChange={setCreateLeader}
                onSearch={(searchQuery) => searchPeopleForEscalation(state.accessToken, searchQuery)}
              />
              <Input label="Notes (optional)" value={createNotes} onChange={(event) => setCreateNotes(event.target.value)} placeholder="Brief notes about this Outreach" />
              {createError && (
                <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                  {createError}
                </Text>
              )}
              <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                <Button variant="primary" size="sm" disabled={!createOccurredAt || !createLeader} loading={createSubmitting} onClick={() => void submitCreate()} testId="outreach-create-submit">
                  Confirm record
                </Button>
                <Button variant="secondary" size="sm" onClick={cancelCreate}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {outreachState.status === 'loading' && (
          <Card padding={6}>
            <Skeleton height={120} />
          </Card>
        )}

        {outreachState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Outreaches" onRetry={outreachState.refetch} />
          </Card>
        )}

        {outreachState.status === 'success' && (
          <Card padding={6} testId="outreach-list-card">
            <Table
              testId="outreach-list-table"
              columns={columns}
              data={outreachState.data}
              getRowId={(outreach) => outreach.id}
              isRowExpanded={(outreach) => expandedOutreachId === outreach.id}
              renderRowDetail={() => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }} data-testid="outreach-contacts-panel">
                  <SectionHeader
                    title="People reached"
                    action={
                      canCreateOutreach && !contactFormOpen ? (
                        <Button variant="secondary" size="sm" onClick={openContactForm} accessibilityLabel="Add a contact reached at this Outreach">
                          + Add contact
                        </Button>
                      ) : undefined
                    }
                  />

                  {contactFormOpen && (
                    <Card padding={4} testId="outreach-contact-form">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                        <Input label="First name" value={contactFirstName} onChange={(event) => setContactFirstName(event.target.value)} testId="outreach-contact-first-name" />
                        <Input label="Last name (optional)" value={contactLastName} onChange={(event) => setContactLastName(event.target.value)} />
                        <Input label="Phone (optional)" value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} />
                        {contactError && (
                          <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                            {contactError}
                          </Text>
                        )}
                        <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                          <Button variant="primary" size="sm" disabled={!contactFirstName.trim()} loading={contactSubmitting} onClick={() => void submitContact()} testId="outreach-contact-submit">
                            Save contact
                          </Button>
                          <Button variant="secondary" size="sm" onClick={() => setContactFormOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {contactsState.status === 'loading' && <Skeleton height={20} />}
                  {contactsState.status === 'error' && <ErrorState title="Couldn't load contacts" onRetry={contactsState.refetch} />}
                  {contactsState.status === 'success' && (
                    <Table
                      testId="outreach-contacts-table"
                      columns={contactColumns}
                      data={contactsState.data}
                      getRowId={(contact) => contact.id}
                      isRowExpanded={(contact) => promotingId === contact.id}
                      renderRowDetail={(contact) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }} data-testid="outreach-promote-form">
                          <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'flex-end' }}>
                            <Input
                              label={contact.lastName ? 'Last name' : 'Last name (required to promote)'}
                              value={promoteLastName}
                              onChange={(event) => setPromoteLastName(event.target.value)}
                              placeholder={contact.lastName ?? undefined}
                            />
                            <Button variant="primary" size="sm" loading={promoteSubmitting} onClick={() => void submitPromote(contact.id)}>
                              Confirm promote
                            </Button>
                            <Button variant="secondary" size="sm" onClick={cancelPromote}>
                              Cancel
                            </Button>
                          </div>
                          {promoteError && (
                            <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                              {promoteError}
                            </Text>
                          )}
                        </div>
                      )}
                      emptyIcon="users"
                      emptyTitle="No contacts recorded yet"
                      emptyDescription="No one has been recorded as reached at this Outreach yet."
                    />
                  )}
                </div>
              )}
              emptyIcon="userPlus"
              emptyTitle="No Outreaches recorded"
              emptyDescription="No Outreach events are visible in your current scope yet."
            />
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
