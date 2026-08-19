import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { PeopleDirectoryPage } from './PeopleDirectoryPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'staff-1', role, branchId: 'branch-1', branchName: 'River of Life HQ', ...extra },
    },
  };
}

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'MEMBER',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bacenta-1',
    branchId: 'branch-1',
    type: 'PASTORAL_CARE',
    name: 'Grace Bacenta',
    meetingSchedule: 'Wednesdays 6pm',
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function potential(overrides: Record<string, unknown> = {}) {
  return {
    id: 'potential-1',
    branchId: 'branch-1',
    groupId: null,
    personId: null,
    firstName: 'Kwame',
    lastName: null,
    phone: null,
    source: 'OUTREACH',
    status: 'NEW',
    notes: null,
    assignedToPersonId: null,
    createdByPersonId: 'leader-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <PeopleDirectoryPage />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

/** Routes every URL this page's hook calls (`GET /people`, `GET
 * /groups?type=PASTORAL_CARE`, `GET /people?groupId=X`, `GET /potentials`)
 * to caller-supplied fixtures, defaulting to empty so an unconfigured test
 * still renders a coherent (if empty) page rather than throwing. */
function mockFetch(overrides: { people?: unknown[]; bacentas?: unknown[]; rosterByGroupId?: Record<string, unknown[]>; potentials?: unknown[] } = {}) {
  return jest.fn().mockImplementation((url: string) => {
    if (url.includes('/groups?type=PASTORAL_CARE')) return Promise.resolve({ ok: true, json: async () => overrides.bacentas ?? [] });
    if (url.includes('/potentials')) return Promise.resolve({ ok: true, json: async () => overrides.potentials ?? [] });
    const groupIdMatch = url.match(/\/people\?groupId=([^&]+)/);
    if (groupIdMatch) {
      const groupId = groupIdMatch[1];
      return Promise.resolve({ ok: true, json: async () => overrides.rosterByGroupId?.[groupId] ?? [] });
    }
    if (url.includes('/people')) return Promise.resolve({ ok: true, json: async () => overrides.people ?? [] });
    return Promise.resolve({ ok: true, json: async () => [] });
  });
}

afterEach(() => jest.clearAllMocks());

describe('[Milestone D] PeopleDirectoryPage', () => {
  it('renders a Bacenta card per real Group, with its real member count', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    const bacentas = [group({ id: 'bacenta-1', name: 'Grace Bacenta' }), group({ id: 'bacenta-2', name: 'Faith Bacenta' })];
    global.fetch = mockFetch({
      bacentas,
      rosterByGroupId: {
        'bacenta-1': [person({ id: 'p1' }), person({ id: 'p2' })],
        'bacenta-2': [person({ id: 'p3' })],
      },
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument());
    expect(within(screen.getByTestId('bacenta-card-bacenta-1')).getByText('Grace Bacenta')).toBeInTheDocument();
    expect(within(screen.getByTestId('bacenta-card-bacenta-1')).getByText('2 members')).toBeInTheDocument();
    expect(within(screen.getByTestId('bacenta-card-bacenta-2')).getByText('1 member')).toBeInTheDocument();
  });

  it('reveals a Bacenta roster inline when its card is clicked, and closes it again', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch({
      bacentas: [group({ id: 'bacenta-1', name: 'Grace Bacenta' })],
      rosterByGroupId: { 'bacenta-1': [person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu' })] },
    });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('bacenta-card-grid')).toBeInTheDocument());
    expect(screen.queryByTestId('selected-bacenta-roster-card')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('bacenta-card-bacenta-1'));

    await waitFor(() => expect(screen.getByTestId('selected-bacenta-roster-card')).toBeInTheDocument());
    expect(within(screen.getByTestId('selected-bacenta-roster-card')).getByRole('link', { name: /Ama Owusu/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByTestId('selected-bacenta-roster-card')).not.toBeInTheDocument();
  });

  it('buckets First Timers and Visitors from the Branch-wide roster by real lifecycle stage', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = mockFetch({
      people: [
        person({ id: 'p1', firstName: 'Kojo', lastName: 'Asante', lifecycleStage: 'FIRST_TIME_GUEST' }),
        person({ id: 'p2', firstName: 'Efua', lastName: 'Danso', lifecycleStage: 'VISITOR' }),
        person({ id: 'p3', firstName: 'Yaw', lastName: 'Mensah', lifecycleStage: 'MEMBER' }),
      ],
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('people-directory-first-timers-card')).toBeInTheDocument());
    expect(within(screen.getByTestId('people-directory-first-timers-card')).getByText('Kojo Asante')).toBeInTheDocument();
    expect(within(screen.getByTestId('people-directory-visitors-card')).getByText('Efua Danso')).toBeInTheDocument();
    expect(within(screen.getByTestId('people-directory-first-timers-card')).queryByText('Yaw Mensah')).not.toBeInTheDocument();
  });

  it('shows an honest empty state for First Timers/Visitors rather than fabricating rows', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch({ people: [] });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('people-directory-first-timers-card')).toBeInTheDocument());
    expect(within(screen.getByTestId('people-directory-first-timers-card')).getByText('None right now')).toBeInTheDocument();
  });

  it('derives "People without a Bacenta" as the Branch roster minus every Bacenta roster', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch({
      people: [person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu' }), person({ id: 'p2', firstName: 'Kofi', lastName: 'Boateng' })],
      bacentas: [group({ id: 'bacenta-1' })],
      rosterByGroupId: { 'bacenta-1': [person({ id: 'p1', firstName: 'Ama', lastName: 'Owusu' })] },
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('people-directory-people-without-a-bacenta-card')).toBeInTheDocument());
    expect(within(screen.getByTestId('people-directory-people-without-a-bacenta-card')).getByText('Kofi Boateng')).toBeInTheDocument();
    expect(within(screen.getByTestId('people-directory-people-without-a-bacenta-card')).queryByText('Ama Owusu')).not.toBeInTheDocument();
  });

  it('renders real Potentials from GET /potentials with their real status', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch({ potentials: [potential({ id: 'potential-1', firstName: 'Kwame', status: 'IN_PROGRESS' })] });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('potentials-card')).toBeInTheDocument());
    expect(within(screen.getByTestId('potentials-card')).getByText('Kwame')).toBeInTheDocument();
    expect(within(screen.getByTestId('potentials-card')).getByText('IN_PROGRESS')).toBeInTheDocument();
  });

  it('shows an ErrorState with retry when the directory fails to load, never a blank or fabricated screen', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load the People directory")).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows the "+ New Person" action only for ADMIN, matching people.person.create', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('ADMIN'));
    global.fetch = mockFetch();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('people-directory-content')).toBeInTheDocument());
    expect(screen.getByTestId('new-person-open')).toBeInTheDocument();
  });

  it('hides the "+ New Person" action for RESIDENT_PASTOR (no people.person.create grant)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = mockFetch();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('people-directory-content')).toBeInTheDocument());
    expect(screen.queryByTestId('new-person-open')).not.toBeInTheDocument();
  });
});
