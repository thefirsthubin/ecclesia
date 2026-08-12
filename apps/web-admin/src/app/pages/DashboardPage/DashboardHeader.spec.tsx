import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { DashboardHeader } from './DashboardHeader';

function renderHeader(branchName: string, overrides: { displayName?: string; openAlertCount?: number } = {}) {
  return render(
    <ThemeProvider>
      <DashboardHeader displayName={overrides.displayName ?? 'Jane Doe'} openAlertCount={overrides.openAlertCount ?? 0} branchName={branchName} />
    </ThemeProvider>,
  );
}

describe('DashboardHeader', () => {
  /**
   * `[Release 1 blocker fix]` The dashboard previously showed a hardcoded
   * `DEMO_CHURCH_NAME` ("Ecclesia Community Church") regardless of which
   * Branch the actor actually belonged to. `branchName` is now a required
   * prop sourced from `GET /auth/me`'s real `Branch.name` lookup - this
   * pins that the component renders whatever real value it's given, not
   * the old fabricated placeholder.
   */
  it("renders the real Branch name it's given, not the old hardcoded placeholder", () => {
    renderHeader('Grace Chapel International');

    expect(screen.getByText('Grace Chapel International')).toBeInTheDocument();
    expect(screen.queryByText('Ecclesia Community Church')).not.toBeInTheDocument();
  });

  it('renders a different real Branch name for a different Branch, proving this is not still a fixed string', () => {
    renderHeader('Second Branch Assembly');

    expect(screen.getByText('Second Branch Assembly')).toBeInTheDocument();
  });

  it('still renders the personalized greeting and alert glance around the Branch name', () => {
    renderHeader('Grace Chapel International', { displayName: 'Jane Doe', openAlertCount: 2 });

    expect(screen.getByText(/Jane$/)).toBeInTheDocument();
    expect(screen.getByText('2 need attention')).toBeInTheDocument();
    expect(screen.getByText('Grace Chapel International')).toBeInTheDocument();
  });
});
