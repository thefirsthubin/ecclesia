import { render, screen } from '@testing-library/react';

import { GroupDetailPage } from './GroupDetailPage';

jest.mock('../../router/router', () => ({
  useParams: () => ({ groupId: 'group-1' }),
}));

jest.mock('./GroupDetailView', () => ({
  GroupDetailView: ({ groupId }: { groupId: string }) => <div data-testid="group-detail-view-stub">{groupId}</div>,
}));

describe('GroupDetailPage', () => {
  it('reads :groupId from the route and passes it straight through to GroupDetailView', () => {
    render(<GroupDetailPage />);

    expect(screen.getByTestId('group-detail-view-stub')).toHaveTextContent('group-1');
  });
});
