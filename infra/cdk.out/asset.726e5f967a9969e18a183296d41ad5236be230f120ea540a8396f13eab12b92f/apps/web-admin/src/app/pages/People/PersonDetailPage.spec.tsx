import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { PersonDetailPage } from './PersonDetailPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// `useParams()` reads from the router's `ParamsContext`, which normally
// comes from a matched `<Route path="/people/:id">` - mocked directly here
// so this test doesn't need a full `RouterProvider`/`Routes` tree just to
// get one param value in, mirroring how `AuthContext` itself is mocked.
jest.mock('../../router/router', () => ({
  useParams: () => ({ id: 'person-1' }),
}));

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'person-1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: '+233555000111',
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

function membership(overrides: Record<string, unknown> = {}) {
  return {
    id: 'membership-1',
    personId: 'person-1',
    groupId: 'group-1',
    groupType: 'PASTORAL_CARE',
    startedAt: new Date('2024-01-01').toISOString(),
    endedAt: null,
    reason: null,
    ...overrides,
  };
}

function roleAssignment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'role-1',
    personId: 'person-1',
    role: 'BACENTA_LEADER',
    branchId: 'branch-1',
    groupId: 'group-1',
    scopeGroupIds: [],
    effectiveFrom: new Date('2024-01-01').toISOString(),
    effectiveTo: null,
    ...overrides,
  };
}

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'PASTORAL_CARE',
    name: 'Faith Bacenta',
    meetingSchedule: null,
    meetingLocation: null,
    category: null,
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockFetchByPath(routes: Record<string, unknown>) {
  return jest.fn().mockImplementation((url: string) => {
    const matched = Object.entries(routes).find(([path]) => url.includes(path));
    if (!matched) {
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => matched[1] });
  });
}

afterEach(() => jest.clearAllMocks());

describe('PersonDetailPage', () => {
  it('renders the profile, group-membership history, and role history (FR-PPL-07)', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = mockFetchByPath({
      '/people/person-1/group-memberships': [membership()],
      '/people/person-1/role-assignments': [roleAssignment()],
      '/groups/group-1': group(),
      '/people/person-1': person(),
    });

    render(
      <ThemeProvider>
        <PersonDetailPage />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('person-profile-card')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Ama Owusu' })).toBeInTheDocument();
    expect(screen.getByText('+233555000111')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Faith Bacenta')).toBeInTheDocument());
    expect(screen.getByText('BACENTA LEADER')).toBeInTheDocument();
  });

  it('shows an empty state when a Person has no group-membership history yet', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = mockFetchByPath({
      '/people/person-1/group-memberships': [],
      '/people/person-1/role-assignments': [],
      '/people/person-1': person(),
    });

    render(
      <ThemeProvider>
        <PersonDetailPage />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText('No group history yet')).toBeInTheDocument());
    expect(screen.getByText('No roles held yet')).toBeInTheDocument();
  });

  it('shows a retryable error state when the Person record itself fails to load', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    render(
      <ThemeProvider>
        <PersonDetailPage />
      </ThemeProvider>,
    );

    await waitFor(() => expect(screen.getByText("Couldn't load this Person")).toBeInTheDocument());
  });
});
