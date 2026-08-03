import { render, screen } from '@testing-library/react-native';

import { ChurchPulseCard } from './ChurchPulseCard';
import { useBacentaDashboard } from '../hooks/useShepherdDashboardData';

jest.mock('../hooks/useShepherdDashboardData');

const mockUseBacentaDashboard = useBacentaDashboard as jest.Mock;

describe('ChurchPulseCard', () => {
  it('shows a skeleton while loading', () => {
    mockUseBacentaDashboard.mockReturnValue({ status: 'loading', refetch: jest.fn() });
    render(<ChurchPulseCard />);
    expect(screen.queryByText('Church Pulse')).toBeNull();
  });

  it('shows the score and band once loaded (FR-INS-01)', () => {
    mockUseBacentaDashboard.mockReturnValue({
      status: 'success',
      data: {
        branchId: 'branch-1',
        groupId: 'bacenta-1',
        pulseScore: { id: 'ps-1', branchId: 'branch-1', scopeType: 'GROUP', scopeId: 'bacenta-1', score: 82, computedAt: '2026-08-01T00:00:00.000Z' },
        alerts: [],
      },
      refetch: jest.fn(),
    });

    render(<ChurchPulseCard />);

    expect(screen.getByText('Church Pulse')).toBeTruthy();
    expect(screen.getByText('82')).toBeTruthy();
    expect(screen.getByText('Thriving')).toBeTruthy();
  });

  it('shows an error state with retry when the fetch fails', () => {
    const refetch = jest.fn();
    mockUseBacentaDashboard.mockReturnValue({ status: 'error', error: new Error('network down'), refetch });

    render(<ChurchPulseCard />);

    expect(screen.getByText("Couldn't load Church Pulse")).toBeTruthy();
  });
});
