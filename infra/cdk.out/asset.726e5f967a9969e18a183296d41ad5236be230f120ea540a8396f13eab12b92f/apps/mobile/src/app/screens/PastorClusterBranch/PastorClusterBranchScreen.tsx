import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Badge, Button, Divider, EmptyState, ErrorState, Heading, Skeleton, Text, useTheme } from '@ecclesia/ui-native';
import { getChurchPulseBand } from '@ecclesia/ui-tokens';
import type { GroupResponseDto } from '@ecclesia/contracts';

import { CardAsyncBoundary } from '../ShepherdDashboard/components/CardAsyncBoundary';
import { useBacentaDashboardById, useBacentaGroups, useBranchDashboard } from '../PastorDashboard/hooks/usePastorData';

const BAND_TO_BADGE_STATUS = {
  thriving: 'success',
  healthy: 'success',
  attention: 'warning',
  atRisk: 'danger',
} as const;

function BacentaRow({ group, expanded, onToggle }: { group: GroupResponseDto; expanded: boolean; onToggle: () => void }) {
  const theme = useTheme();
  const pulseState = useBacentaDashboardById(expanded ? group.id : null);

  return (
    <View style={{ gap: theme.spacing[2] }} testID={`pastor-cluster-row-${group.id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="body">{group.name}</Text>
        <Button variant="tertiary" size="sm" onPress={onToggle} testId={`pastor-cluster-toggle-${group.id}`}>
          {expanded ? 'Hide' : 'View Pulse'}
        </Button>
      </View>
      {group.meetingSchedule && (
        <Text variant="bodySmall" color={theme.colors.text.secondary}>
          {group.meetingSchedule}
        </Text>
      )}
      {expanded && (
        <View testID={`pastor-cluster-pulse-${group.id}`}>
          {pulseState.status === 'loading' && <Skeleton height={20} width="40%" />}
          {pulseState.status === 'error' && (
            <ErrorState title="Couldn't load this Bacenta's Pulse" description={pulseState.error.message} onRetry={pulseState.refetch} testId={`pastor-cluster-pulse-error-${group.id}`} />
          )}
          {pulseState.status === 'success' && pulseState.data && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
              <Text variant="bodySmall">{`Pulse: ${Math.round(pulseState.data.pulseScore.score)}`}</Text>
              <Badge status={BAND_TO_BADGE_STATUS[getChurchPulseBand(pulseState.data.pulseScore.score).key]}>
                {getChurchPulseBand(pulseState.data.pulseScore.score).label}
              </Badge>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Resident Pastor "Cluster/Branch" - the milestone brief's third tab for
 * this persona. There is no distinct "Cluster" Group type anywhere in
 * this schema (`GROUP_TYPE_VALUES` is only `PASTORAL_CARE`/`MINISTRY` -
 * `people.schemas.ts`) and `insights.cluster_dashboard.read`'s own
 * backing endpoint (`GET /insights/cluster-dashboard/:groupId`) operates
 * on an ordinary Bacenta's `groupId`, just under a different RBAC
 * action/scope for `ASSISTANT_PASTOR` - there is no "list of clusters" to
 * browse for any role. This screen is therefore built as: the Branch
 * Pulse header (reusing `useBranchDashboard`, the same data the Dashboard
 * tab's own top card shows) plus a Branch-wide list of every Bacenta
 * (`GET /groups?type=PASTORAL_CARE`), each expandable in place to its own
 * Pulse score (`GET /insights/bacenta-dashboard/:groupId`, fetched lazily
 * per row - see `useBacentaDashboardById`'s own doc comment for why this
 * is on-demand, not fetched upfront for every Bacenta at once). See
 * `MOBILE_PERSONAS_DESIGN_NOTES.md` for the full disclosed reasoning
 * behind this interpretation.
 */
export function PastorClusterBranchScreen() {
  const theme = useTheme();
  const branchState = useBranchDashboard();
  const groupsState = useBacentaGroups();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={{ padding: theme.spacing[4], gap: theme.spacing[4] }}>
      <Heading level={1}>Branch</Heading>

      <CardAsyncBoundary state={branchState} onRetry={branchState.refetch} errorTitle="Couldn't load Church Pulse" skeletonLines={1}>
        {(data) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] }}>
            <Text variant="body">{`Branch Pulse: ${Math.round(data.pulseScore.score)}`}</Text>
            <Badge status={BAND_TO_BADGE_STATUS[getChurchPulseBand(data.pulseScore.score).key]}>{getChurchPulseBand(data.pulseScore.score).label}</Badge>
          </View>
        )}
      </CardAsyncBoundary>

      <Heading level={3}>Bacentas</Heading>

      {groupsState.status === 'loading' && (
        <View style={{ gap: theme.spacing[3] }}>
          <Skeleton height={48} radius="md" />
          <Skeleton height={48} radius="md" />
        </View>
      )}

      {groupsState.status === 'error' && (
        <ErrorState title="Couldn't load your Branch's Bacentas" description={groupsState.error.message} onRetry={groupsState.refetch} testId="pastor-cluster-error" />
      )}

      {groupsState.status === 'success' &&
        (groupsState.data.length === 0 ? (
          <EmptyState icon="users" title="No Bacentas in this Branch yet" />
        ) : (
          <View style={{ gap: theme.spacing[3] }}>
            {groupsState.data.map((group, index) => (
              <View key={group.id}>
                {index > 0 && <Divider />}
                <View style={{ paddingTop: index > 0 ? theme.spacing[3] : 0 }}>
                  <BacentaRow
                    group={group}
                    expanded={expandedId === group.id}
                    onToggle={() => setExpandedId((current) => (current === group.id ? null : group.id))}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
    </ScrollView>
  );
}
