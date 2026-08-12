import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { BacentaDetailView } from './BacentaDetailView';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const group = {
  id: 'bacenta-1',
  branchId: 'branch-1',
  type: 'PASTORAL_CARE' as const,
  name: 'Grace Bacenta',
  meetingSchedule: 'Sundays 9am',
  meetingLocation: 'Main Auditorium',
  category: null,
  lifecycleStatus: 'ACTIVE' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function personResponse(id: string, firstName: string, lastName: string) {
  return {
    id,
    branchId: 'branch-1',
    firstName,
    lastName,
    phone: '+233000000',
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function renderView(fetchImpl: (url: string) => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>) {
  mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
  global.fetch = jest.fn().mockImplementation(fetchImpl) as unknown as typeof fetch;
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <BacentaDetailView group={group} />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('BacentaDetailView', () => {
  it('renders the Overview tab by default, including the Group\'s own fields and the leadership limitation note', () => {
    renderView(() => Promise.resolve({ ok: true, json: async () => [] }));

    expect(screen.getByRole('heading', { name: 'Grace Bacenta' })).toBeInTheDocument();
    expect(screen.getByTestId('bacenta-overview-card')).toBeInTheDocument();
    expect(screen.getByText(/Meets: Sundays 9am at Main Auditorium/)).toBeInTheDocument();
    expect(screen.getByText(/Leadership for this Bacenta isn't listed here/)).toBeInTheDocument();
  });

  it('shows current Members (GET /people?groupId=) on the Members tab', async () => {
    renderView((url) => {
      if (url.includes('/people?groupId=bacenta-1')) {
        return Promise.resolve({ ok: true, json: async () => [personResponse('person-1', 'Kojo', 'Boateng')] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Members' }));

    await waitFor(() => expect(screen.getByText('Kojo Boateng')).toBeInTheDocument());
  });

  it('shows this Bacenta\'s Gatherings (GET /gatherings?ownerGroupId=) on the Gatherings tab', async () => {
    renderView((url) => {
      if (url.includes('/gatherings') && url.includes('ownerGroupId=bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 'gathering-1', branchId: 'branch-1', ownerGroupId: 'bacenta-1', type: 'Cell Meeting', scheduledStart: new Date('2024-03-01T10:00:00Z').toISOString(), scheduledEnd: null, venue: null, status: 'SCHEDULED', config: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          ],
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Gatherings' }));

    await waitFor(() => expect(screen.getByText('Cell Meeting')).toBeInTheDocument());
  });

  it('shows Follow-up tasks scoped to this Bacenta (GET /pastoral-care/follow-up-tasks?groupId=) on the Follow-up tab', async () => {
    renderView((url) => {
      if (url.includes('/pastoral-care/follow-up-tasks') && url.includes('groupId=bacenta-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 'task-1',
              branchId: 'branch-1',
              personId: 'person-1',
              groupId: 'bacenta-1',
              assignedToPersonId: 'person-2',
              trigger: 'MANUAL',
              status: 'OPEN',
              dueAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        });
      }
      if (url.includes('/people/person-1')) {
        return Promise.resolve({ ok: true, json: async () => personResponse('person-1', 'Efua', 'Danso') });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    fireEvent.click(screen.getByRole('tab', { name: 'Follow-up' }));

    await waitFor(() => expect(screen.getByText('Efua Danso')).toBeInTheDocument());
  });
});
