import { render, screen } from '@testing-library/react-native';

import { PriorityCard } from './PriorityCard';
import { useOpenFollowUpTasks, usePersonName, useSilentDriftFlags } from '../hooks/useShepherdDashboardData';

jest.mock('../hooks/useShepherdDashboardData');

const mockUseOpenFollowUpTasks = useOpenFollowUpTasks as jest.Mock;
const mockUseSilentDriftFlags = useSilentDriftFlags as jest.Mock;
const mockUsePersonName = usePersonName as jest.Mock;

describe('PriorityCard', () => {
  beforeEach(() => {
    mockUsePersonName.mockReturnValue({
      status: 'success',
      data: { firstName: 'Ama', lastName: 'Boateng' },
      refetch: jest.fn(),
    });
  });

  it('shows a positive empty state when there are no open follow-ups or drift flags (Design System §4.2)', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    mockUseSilentDriftFlags.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });

    render(<PriorityCard />);

    expect(screen.getByText('All caught up')).toBeTruthy();
  });

  it('shows the specific silent-drift pattern, not a generic "at risk" label (US-G3)', () => {
    mockUseOpenFollowUpTasks.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    mockUseSilentDriftFlags.mockReturnValue({
      status: 'success',
      data: [
        {
          id: 'sdf-1',
          branchId: 'branch-1',
          groupId: 'bacenta-1',
          personId: 'person-1',
          attendanceMissedCount: 0,
          attendanceThreshold: 3,
          bacentaMissedCount: 3,
          bacentaThreshold: 3,
          status: 'FLAGGED',
          assignedShepherdPersonId: 'shepherd-1',
          resolvedAt: null,
          escalatedAt: null,
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      ],
      refetch: jest.fn(),
    });

    render(<PriorityCard />);

    expect(screen.getByText('3/3 Sundays present, 3/3 Bacenta meetings absent')).toBeTruthy();
    expect(screen.getByText('Ama Boateng')).toBeTruthy();
  });

  it('shows open follow-up tasks with an overdue badge when past due', () => {
    mockUseSilentDriftFlags.mockReturnValue({ status: 'success', data: [], refetch: jest.fn() });
    mockUseOpenFollowUpTasks.mockReturnValue({
      status: 'success',
      data: [
        {
          id: 'ft-1',
          branchId: 'branch-1',
          groupId: 'bacenta-1',
          personId: 'person-1',
          assignedToPersonId: 'shepherd-1',
          status: 'OPEN',
          dueAt: '2020-01-01T00:00:00.000Z',
          escalatedAt: null,
          escalatedToPersonId: null,
          createdByPersonId: null,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
        },
      ],
      refetch: jest.fn(),
    });

    render(<PriorityCard />);

    expect(screen.getByText('Overdue')).toBeTruthy();
  });
});
