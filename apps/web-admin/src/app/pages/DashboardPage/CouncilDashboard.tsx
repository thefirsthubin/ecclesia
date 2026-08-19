import { Card, ErrorState, MetricCard, PageContainer, PageHeader, SectionHeader, Skeleton, useTheme } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { formatAmountMinor } from '../Stewardship/useStewardshipData';
import { useCouncilAttendanceTrend, useCouncilGivingTrend, useCouncilMembershipTrend } from '../Insights/useCouncilTrendData';
import type { BranchAttendanceResult, BranchGivingResult, BranchMembershipResult } from '../Insights/useCouncilTrendData';
import { useDashboardBreakpoint } from './useDashboardBreakpoint';

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function formatWeekRangeLabel(fromIso: string, toIso: string): string {
  const start = new Date(fromIso);
  const end = new Date(new Date(toIso).getTime() - MILLISECONDS_PER_DAY);
  const startLabel = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const endLabel = end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `Week of ${startLabel} – ${endLabel}`;
}

/** No `GET /branches/:id` (or any Branch list/lookup) endpoint exists
 * anywhere in `apps/api` - `actor.branchName` only ever resolves the
 * acting user's own home Branch (`AuthController`'s own doc comment).
 * For the actor's own Branch this is a real name; for any other Branch
 * in their Council (not reachable in today's single-Branch deployment,
 * but the real, honest fallback once a second Branch exists) this shows
 * the raw `branchId` rather than fabricating a name - a disclosed
 * backend gap, not a guess. */
function branchLabel(branchId: string, actorBranchId: string, actorBranchName: string): string {
  return branchId === actorBranchId ? actorBranchName : branchId;
}

/**
 * `[Milestone D — Portal Experiences, Portal 7: Council]` Dashboard -
 * previously fell to the generic "coming soon for this role" stub for
 * both `COUNCIL_OVERSEER` and `COUNCIL_TREASURER`. Real data throughout,
 * via `useCouncilTrendData.ts`'s three `council=true` hooks - one real
 * Branch-row per Branch in the actor's own Council (traced against
 * `permission-matrix.ts`: `COUNCIL_OVERSEER` holds `people.person.read`/
 * `gatherings.attendance.read`/`stewardship.transaction.read` at COUNCIL,
 * `COUNCIL_TREASURER` holds only `stewardship.transaction.read` at
 * COUNCIL - this dashboard renders Attendance/Membership only for the
 * former). No Council Branch comparison is fabricated for today's
 * single-Branch deployment - whatever real Branches the actor's own
 * Council contains is exactly what renders, matching the reasoning that
 * already removed this app's prior `DEMO_COUNCIL_BRANCHES` preview data.
 * No Prayer Notes/Counselling/Interaction content anywhere on this page -
 * neither Council role holds any `pastoral_care.*` grant (Milestone D
 * rule 4).
 */
export function CouncilDashboard() {
  const theme = useTheme();
  const { state } = useAuth();
  const accessToken = state.status === 'authenticated' ? state.accessToken : undefined;
  const actorBranchId = state.status === 'authenticated' ? state.actor.branchId : '';
  const actorBranchName = state.status === 'authenticated' ? state.actor.branchName : '';
  const isOverseer = state.status === 'authenticated' && state.actor.role === 'COUNCIL_OVERSEER';
  const { isCompact } = useDashboardBreakpoint();

  const givingState = useCouncilGivingTrend(accessToken, { granularity: 'week', count: 1 });
  const attendanceState = useCouncilAttendanceTrend(isOverseer ? accessToken : undefined, { granularity: 'week', count: 1 });
  const membershipState = useCouncilMembershipTrend(isOverseer ? accessToken : undefined, { granularity: 'week', count: 1 });

  const weekContext = givingState.status === 'success' && givingState.data[0] ? formatWeekRangeLabel(givingState.data[0].from, givingState.data[0].to) : 'This week';

  if (state.status !== 'authenticated') return null;

  const metricGridStyle = { display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing[3] };

  const attendanceByBranch = new Map<string, BranchAttendanceResult>();
  if (attendanceState.status === 'success') for (const branch of attendanceState.data) attendanceByBranch.set(branch.branchId, branch);
  const membershipByBranch = new Map<string, BranchMembershipResult>();
  if (membershipState.status === 'success') for (const branch of membershipState.data) membershipByBranch.set(branch.branchId, branch);

  return (
    <PageContainer maxWidth={1280}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
        <PageHeader title="Dashboard" context={`${state.actor.role === 'COUNCIL_OVERSEER' ? 'Council Administrator' : 'Council Treasurer'} · ${weekContext}`} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
          {givingState.status === 'loading' && (
            <Card padding={6}>
              <Skeleton height={120} />
            </Card>
          )}
          {givingState.status === 'error' && (
            <Card padding={6}>
              <ErrorState title="Couldn't load Council giving" onRetry={givingState.refetch} />
            </Card>
          )}
          {givingState.status === 'success' &&
            (givingState.data.length === 0 ? (
              <Card padding={6}>
                <ErrorState title="No Branches in your Council" description="Your account is not yet associated with any Branch." onRetry={() => undefined} />
              </Card>
            ) : (
              givingState.data.map((branch: BranchGivingResult) => {
                const attendance = attendanceByBranch.get(branch.branchId);
                const membership = membershipByBranch.get(branch.branchId);
                const givingTotal = branch.buckets[0]?.totalAmountMinor ?? null;
                return (
                  <Card padding={6} key={branch.branchId} testId="council-branch-card">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                      <SectionHeader title={branchLabel(branch.branchId, actorBranchId, actorBranchName)} description={weekContext} />
                      <div style={metricGridStyle}>
                        <MetricCard label="Giving" value={givingTotal === null ? null : formatAmountMinor(givingTotal, 'GHS')} context={weekContext} testId="metric-council-giving" />
                        {isOverseer && (
                          <MetricCard label="Sunday Attendance" value={attendance ? String(attendance.buckets[0]?.presentCount ?? 0) : null} context={weekContext} testId="metric-council-attendance" />
                        )}
                        {isOverseer && (
                          <MetricCard
                            label="Registered Members"
                            value={membership ? String(membership.snapshot.registeredPeopleCount) : null}
                            context="Right now"
                            testId="metric-council-members"
                          />
                        )}
                        {isOverseer && (
                          <MetricCard
                            label="Active Members"
                            value={membership ? String(membership.snapshot.activeMembersCount) : null}
                            context={membership ? `Attended Sunday in the last ${membership.snapshot.activeMemberWindowWeeks} weeks` : 'This week'}
                            testId="metric-council-active-members"
                          />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ))}

          {isOverseer && attendanceState.status === 'error' && (
            <Card padding={4}>
              <ErrorState title="Couldn't load Council attendance" onRetry={attendanceState.refetch} />
            </Card>
          )}
          {isOverseer && membershipState.status === 'error' && (
            <Card padding={4}>
              <ErrorState title="Couldn't load Council membership" onRetry={membershipState.refetch} />
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
