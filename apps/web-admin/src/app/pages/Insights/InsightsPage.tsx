import { EmptyState, PageContainer } from '@ecclesia/ui-web';

import { useAuth } from '../../auth/AuthContext';
import { BranchInsightsView } from './BranchInsightsView';
import { BranchTrendsSection } from './BranchTrendsSection';

/**
 * The `/insights` nav entry (Design System §3.1's persistent sidebar,
 * distinct from `/dashboard`'s landing page - PRD §16.6's own "Key
 * surfaces" table names "Resident Pastor's church-wide dashboard" as an
 * Insights capability even though it is *also* the Application Shell's
 * default landing screen; Design System §3.3's traceability table
 * confirms both: "Insights | Resident Pastor dashboard, Assistant Pastor
 * cluster dashboard." Those are the two named Web Admin Insights
 * surfaces this sprint builds - see `INSIGHTS_PAGE_DESIGN_NOTES.md` for
 * why a Shepherd's own-Bacenta view and the H2 weight-configuration panel
 * are not part of it.
 *
 * `[UX Design Implementation]` Final UX Design Specification §14
 * (decision 8) - Dashboard and Insights are now genuinely different
 * screens, not near-duplicates. Dashboard answers "what do I need to
 * know right now" (Church Pulse hero, KPI totals, Alerts, Quick Actions);
 * Insights answers "what's happening over time" (the six-month growth
 * chart, the Bacenta Leaderboard, the Engagement Trend figure -
 * `BranchTrendsSection`, all real, from the exact same
 * `branch-dashboard-summary` endpoint Dashboard's own KPI strip already
 * calls). Neither Church Pulse's current score nor Alerts render here
 * anymore - both already have a home on Dashboard, and repeating them
 * here would be exactly the "simply duplicate the same cards on both
 * screens" the Design Spec explicitly rules out.
 *
 * `ADMIN` (Super Administrator) previously saw *less* here than on their
 * own Dashboard (`AdminInsightsView`, removed) - a real inconsistency
 * for a screen whose whole purpose is deeper analysis. It now renders
 * the identical `BranchTrendsSection` `RESIDENT_PASTOR` does: both roles
 * hold the same `insights.branch_dashboard.read` (BRANCH) grant in
 * `permission-matrix.ts`, traced not assumed, so this uses a permission
 * Super Administrator already had, not a new one.
 *
 * `[Branch Pastor portal, Insights rebuild]` `ASSISTANT_PASTOR` now
 * renders `BranchInsightsView`, not `ClusterInsightsView` (removed - see
 * that component's own former doc comment, preserved in git history, for
 * why its single-Bacenta-at-a-time picker was replaced rather than
 * refined: it could not answer any of the approved brief's own example
 * questions - "which Bacentas are healthy," "is attendance increasing or
 * declining," "what follow-ups are overdue"). Every other role's branch
 * here is unchanged.
 */
export function InsightsPage() {
  const { state } = useAuth();

  if (state.status !== 'authenticated') return null;

  const role = state.actor.role;
  const accessToken = state.accessToken;

  if (role === 'RESIDENT_PASTOR' || role === 'ACTING_RESIDENT_PASTOR' || role === 'ADMIN') {
    return <BranchTrendsSection accessToken={accessToken} />;
  }

  if (role === 'ASSISTANT_PASTOR') {
    return <BranchInsightsView />;
  }

  if (role === 'BACENTA_LEADER' || role === 'BASONTA_LEADER') {
    return (
      <PageContainer>
        <EmptyState
          icon="home"
          title="Your Bacenta pulse view lives on mobile"
          description="Design System §3.3 places the Shepherd's Bacenta pulse view on the mobile app, not Web Admin. Open the Ecclesia mobile app to see it."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <EmptyState
        icon="clock"
        title="Insights — not available for this role"
        description="Your role does not have an Insights view in this release."
      />
    </PageContainer>
  );
}
