import { useState } from 'react';
import { Button, Card, Divider, EmptyState, ErrorState, Input, PageContainer, PageHeader, SectionHeader, Skeleton, Switch, Text, useTheme } from '@ecclesia/ui-web';
import { CHURCH_PULSE_SIGNAL_TYPE_VALUES } from '@ecclesia/contracts';
import type { ChurchPulseSignalTypeDto } from '@ecclesia/contracts';

import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../lib/api-client';
import { createBranchConfiguration, updateBranchConfiguration, useBranchConfiguration } from './useConfigurationData';

const ALLOWED_ROLES = ['ADMIN', 'COUNCIL_OVERSEER'] as const;

const CHURCH_PULSE_SIGNAL_LABEL: Record<ChurchPulseSignalTypeDto, string> = {
  ATTENDANCE: 'Attendance',
  GROUP_MEMBERSHIP: 'Group Membership',
  FINANCIAL_GIVING: 'Financial Giving',
  FOLLOW_UP_OUTCOME: 'Follow-up Outcome',
  ROLE_ASSIGNMENT: 'Role Assignment',
  VISITOR_CONVERSION: 'Visitor Conversion',
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
 * `[Branch Configuration milestone]` PRD §17.3's "Configuration:
 * gathering/role/group types" row, `platform.configuration.*`'s three
 * fields with a real, active consumer - `churchPulseWeights`,
 * `poimenGateEnabled`, `silentDriftConfig` (see `useConfigurationData.ts`
 * and `platform.schemas.ts`'s own doc comments for the full consumer
 * trace). `gatheringTypes`/`followupSlaDefaults` are deliberately not
 * shown - neither has any actual reader in `apps/api`/`apps/worker`
 * today, confirmed by repo-wide search, not assumed.
 *
 * **A disclosed RBAC/nav mismatch, not fixed here** (per this
 * milestone's own instruction: report, don't silently change
 * authorization semantics): this page's own pre-existing client-side
 * gate (`ALLOWED_ROLES`, unchanged) and `nav-items.ts` both cite Design
 * System v1.0 §3.1's "Admin/Council Administrator roles only." The real
 * `platform.configuration.*` RBAC rows (`permission-matrix.ts`) say
 * something different: only `ADMIN` can create/update (traced,
 * live-verified); `RESIDENT_PASTOR` (BRANCH) and `ASSISTANT_PASTOR`
 * (CLUSTER - structurally unreachable, the same class of gap already
 * disclosed for Bank Deposit/Follow-up Task/Silent-Drift) can read;
 * `COUNCIL_OVERSEER` - the role this page's own gate admits - holds
 * **no grant at all** for this action, so their every real API call here
 * 403s; `ADMIN` - the role that can actually configure anything - holds
 * no `.read` grant, so `useBranchConfiguration` below 403s for them even
 * though they can `create`/`update`. No client-side pre-emption of any
 * of this - the backend's real response is what each role sees, the same
 * precedent every other milestone this session established.
 */
export function ConfigurationPage() {
  const theme = useTheme();
  const { state } = useAuth();

  const [poimenBusy, setPoimenBusy] = useState(false);
  const [poimenError, setPoimenError] = useState<string | undefined>(undefined);

  const [editOpen, setEditOpen] = useState(false);
  const [editWeights, setEditWeights] = useState<Record<ChurchPulseSignalTypeDto, string>>({
    ATTENDANCE: '',
    GROUP_MEMBERSHIP: '',
    FINANCIAL_GIVING: '',
    FOLLOW_UP_OUTCOME: '',
    ROLE_ASSIGNMENT: '',
    VISITOR_CONVERSION: '',
  });
  const [editN, setEditN] = useState('');
  const [editM, setEditM] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | undefined>(undefined);

  if (state.status !== 'authenticated') return null;

  if (!ALLOWED_ROLES.includes(state.actor.role as (typeof ALLOWED_ROLES)[number])) {
    return (
      <PageContainer maxWidth={640}>
        <EmptyState
          icon="alertCircle"
          title="You don't have access to Configuration"
          description="This section is limited to Super Administrator and Council Administrator roles."
        />
      </PageContainer>
    );
  }

  const configState = useBranchConfiguration(state.accessToken);

  const togglePoimenGate = async (checked: boolean) => {
    if (configState.status !== 'success') return;
    setPoimenBusy(true);
    setPoimenError(undefined);
    try {
      await updateBranchConfiguration(state.accessToken, { poimenGateEnabled: checked });
      configState.refetch();
    } catch (error) {
      setPoimenError(extractErrorMessage(error, 'Something went wrong saving this setting.'));
    } finally {
      setPoimenBusy(false);
    }
  };

  const openEdit = () => {
    if (configState.status === 'success') {
      setEditWeights({
        ATTENDANCE: configState.data.churchPulseWeights.ATTENDANCE?.toString() ?? '',
        GROUP_MEMBERSHIP: configState.data.churchPulseWeights.GROUP_MEMBERSHIP?.toString() ?? '',
        FINANCIAL_GIVING: configState.data.churchPulseWeights.FINANCIAL_GIVING?.toString() ?? '',
        FOLLOW_UP_OUTCOME: configState.data.churchPulseWeights.FOLLOW_UP_OUTCOME?.toString() ?? '',
        ROLE_ASSIGNMENT: configState.data.churchPulseWeights.ROLE_ASSIGNMENT?.toString() ?? '',
        VISITOR_CONVERSION: configState.data.churchPulseWeights.VISITOR_CONVERSION?.toString() ?? '',
      });
      setEditN(configState.data.silentDriftConfig.n?.toString() ?? '');
      setEditM(configState.data.silentDriftConfig.m?.toString() ?? '');
    }
    setEditError(undefined);
    setEditOpen(true);
  };
  const cancelEdit = () => {
    setEditOpen(false);
    setEditError(undefined);
  };
  const submitEdit = async () => {
    setEditSubmitting(true);
    setEditError(undefined);
    const churchPulseWeights: Record<string, number> = {};
    for (const type of CHURCH_PULSE_SIGNAL_TYPE_VALUES) {
      const raw = editWeights[type].trim();
      if (raw.length > 0 && !Number.isNaN(Number(raw))) {
        churchPulseWeights[type] = Number(raw);
      }
    }
    const silentDriftConfig: { n?: number; m?: number } = {};
    if (editN.trim().length > 0 && !Number.isNaN(Number(editN))) silentDriftConfig.n = Number(editN);
    if (editM.trim().length > 0 && !Number.isNaN(Number(editM))) silentDriftConfig.m = Number(editM);

    try {
      if (configState.status === 'success') {
        await updateBranchConfiguration(state.accessToken, { churchPulseWeights, silentDriftConfig });
      } else {
        await createBranchConfiguration(state.accessToken, { churchPulseWeights, silentDriftConfig });
      }
      configState.refetch();
      setEditOpen(false);
    } catch (error) {
      setEditError(extractErrorMessage(error, 'Something went wrong saving Configuration.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <PageContainer maxWidth={640}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
        <PageHeader title="Configuration" />

        {configState.status === 'loading' && (
          <Card padding={6}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
            </div>
          </Card>
        )}

        {configState.status === 'error' && (
          <Card padding={6}>
            <ErrorState title="Couldn't load Configuration" onRetry={configState.refetch} />
          </Card>
        )}

        {configState.status === 'success' && (
          <Card padding={6} testId="poimen-gate-card">
            <Switch
              label="Poimen gate"
              checked={configState.data.poimenGateEnabled}
              onChange={(checked) => void togglePoimenGate(checked)}
              disabled={poimenBusy}
              helperText="When enabled, a Bacenta Leader role assignment requires the candidate's Poimen enrollment to be Complete."
              testId="poimen-gate-switch"
            />
            {poimenError && (
              <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                {poimenError}
              </Text>
            )}
          </Card>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          <SectionHeader
            title="Church Pulse weights & Silent-Drift thresholds"
            action={
              !editOpen ? (
                <Button variant="primary" size="sm" onClick={openEdit} accessibilityLabel="Edit Configuration">
                  Edit
                </Button>
              ) : undefined
            }
          />

          {!editOpen && configState.status === 'success' && (
            <Card padding={6} testId="configuration-summary-card">
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {CHURCH_PULSE_SIGNAL_TYPE_VALUES.map((type) => (
                  <Text key={type} variant="bodySmall">
                    {CHURCH_PULSE_SIGNAL_LABEL[type]}: {configState.data.churchPulseWeights[type] ?? '(default)'}
                  </Text>
                ))}
                <Divider />
                <Text variant="bodySmall">Silent-Drift N (Gatherings): {configState.data.silentDriftConfig.n ?? '(default)'}</Text>
                <Text variant="bodySmall">Silent-Drift M (Bacenta Meetings): {configState.data.silentDriftConfig.m ?? '(default)'}</Text>
              </div>
            </Card>
          )}

          {editOpen && (
            <Card padding={6} testId="configuration-edit-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>
                  Leave a field blank to use its default.
                </Text>
                {CHURCH_PULSE_SIGNAL_TYPE_VALUES.map((type) => (
                  <Input
                    key={type}
                    label={CHURCH_PULSE_SIGNAL_LABEL[type]}
                    type="number"
                    value={editWeights[type]}
                    onChange={(event) => setEditWeights((prev) => ({ ...prev, [type]: event.target.value }))}
                    placeholder="e.g. 0.1667"
                    testId={`configuration-weight-${type}`}
                  />
                ))}
                <Divider />
                <Input
                  label="Silent-Drift N (last N Sunday/Wed/Fri Gatherings)"
                  type="number"
                  value={editN}
                  onChange={(event) => setEditN(event.target.value)}
                  placeholder="e.g. 3"
                  testId="configuration-silent-drift-n"
                />
                <Input
                  label="Silent-Drift M (last M Bacenta Meetings)"
                  type="number"
                  value={editM}
                  onChange={(event) => setEditM(event.target.value)}
                  placeholder="e.g. 3"
                  testId="configuration-silent-drift-m"
                />
                {editError && (
                  <Text variant="bodySmall" color={theme.colors.status.danger.strong}>
                    {editError}
                  </Text>
                )}
                <div style={{ display: 'flex', gap: theme.spacing[2] }}>
                  <Button variant="primary" size="sm" loading={editSubmitting} onClick={() => void submitEdit()} testId="configuration-edit-submit">
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
