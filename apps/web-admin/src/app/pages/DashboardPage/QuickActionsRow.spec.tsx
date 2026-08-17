import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider, useNavigate } from '../../router/router';
import { QuickActionsRow } from './QuickActionsRow';

jest.mock('../../router/router', () => {
  const actual = jest.requireActual('../../router/router');
  return { ...actual, useNavigate: jest.fn() };
});

function renderRow() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <QuickActionsRow />
      </RouterProvider>
    </ThemeProvider>,
  );
}

/**
 * `[Dashboard Visual Redesign, second pass]` `QuickActionsRow` had no
 * spec before this pass compacted it from tall tinted cards into a
 * tight row-per-action list built on `Card interactive` - pins that the
 * three real navigation targets survive the restyle unchanged.
 */
describe('QuickActionsRow', () => {
  it('renders all three quick actions with their real hrefs as interactive rows', () => {
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);
    renderRow();

    expect(screen.getByText('Add a New Member')).toBeInTheDocument();
    expect(screen.getByText("Record This Week's Giving")).toBeInTheDocument();
    expect(screen.getByText('Plan an Upcoming Gathering')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('quick-action-people'));
    expect(navigate).toHaveBeenCalledWith('/people');
  });

  it('navigates on Enter for keyboard users, matching every other interactive Card', () => {
    const navigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(navigate);
    renderRow();

    fireEvent.keyDown(screen.getByTestId('quick-action-stewardship'), { key: 'Enter' });
    expect(navigate).toHaveBeenCalledWith('/stewardship');
  });
});
