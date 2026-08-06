import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { ProfileScreen } from './ProfileScreen';
import * as authContext from '../../auth/AuthContext';
import * as sessionLib from '../../lib/session';

jest.mock('../../auth/AuthContext', () => ({
  ...jest.requireActual('../../auth/AuthContext'),
  useAuth: jest.fn(),
}));
const mockedUseAuth = authContext.useAuth as jest.Mock;

/**
 * `[Mobile Personas sprint]` Only `useActorSession` is mocked - `useGroupNameById`
 * is left real (exercised via the `global.fetch` mocks below), the same
 * split the pre-generalization version of this spec already used for
 * `useGroupName`/`GET /groups/:id`.
 */
jest.mock('../../lib/session', () => ({
  ...jest.requireActual('../../lib/session'),
  useActorSession: jest.fn(),
}));
const mockedUseActorSession = sessionLib.useActorSession as jest.Mock;

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
}

function renderScreen() {
  return render(
    <ThemeProvider>
      <ProfileScreen />
    </ThemeProvider>,
  );
}

describe('ProfileScreen', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the signed-in Shepherd\'s name, role, and Bacenta name once both fetches resolve', async () => {
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-1',
        actor: { personId: 'shepherd-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });
    mockedUseActorSession.mockReturnValue({
      personId: 'shepherd-1',
      branchId: 'branch-1',
      role: 'BACENTA_LEADER',
      bacentaGroupId: 'bacenta-1',
      authToken: 'token-1',
    });
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/people/shepherd-1')) {
        return jsonResponse({
          id: 'shepherd-1',
          branchId: 'branch-1',
          firstName: 'Kofi',
          lastName: 'Mensah',
          phone: null,
          email: null,
          dateOfBirth: null,
          address: null,
          lifecycleStage: 'SHEPHERD',
          guardianPersonId: null,
          createdAt: '',
          updatedAt: '',
        });
      }
      if (url.includes('/groups/bacenta-1')) {
        return jsonResponse({
          id: 'bacenta-1',
          branchId: 'branch-1',
          type: 'PASTORAL_CARE',
          name: 'Bacenta 12',
          meetingSchedule: null,
          meetingLocation: null,
          category: null,
          lifecycleStatus: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Kofi Mensah')).toBeTruthy());
    expect(screen.getByText('Bacenta Leader')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Bacenta 12')).toBeTruthy());
  });

  it('shows the signed-in Ministry Leader\'s Basonta name (not "Bacenta")', async () => {
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-2',
        actor: { personId: 'ministry-1', role: 'BASONTA_LEADER', branchId: 'branch-1', basontaId: 'basonta-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });
    mockedUseActorSession.mockReturnValue({
      personId: 'ministry-1',
      branchId: 'branch-1',
      role: 'BASONTA_LEADER',
      basontaGroupId: 'basonta-1',
      authToken: 'token-2',
    });
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/people/ministry-1')) {
        return jsonResponse({
          id: 'ministry-1',
          branchId: 'branch-1',
          firstName: 'Ama',
          lastName: 'Owusu',
          phone: null,
          email: null,
          dateOfBirth: null,
          address: null,
          lifecycleStage: 'WORKER',
          guardianPersonId: null,
          createdAt: '',
          updatedAt: '',
        });
      }
      if (url.includes('/groups/basonta-1')) {
        return jsonResponse({
          id: 'basonta-1',
          branchId: 'branch-1',
          type: 'MINISTRY',
          name: 'Choir',
          meetingSchedule: null,
          meetingLocation: null,
          category: 'Music',
          lifecycleStatus: 'ACTIVE',
          createdAt: '',
          updatedAt: '',
        });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeTruthy());
    expect(screen.getByText('Basonta Leader')).toBeTruthy();
    expect(screen.getByText('Basonta')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Choir')).toBeTruthy());
  });

  it('omits the Group row entirely for a BRANCH-scoped Treasurer (no bacentaId/basontaId)', async () => {
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-3',
        actor: { personId: 'treasurer-1', role: 'TREASURER', branchId: 'branch-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout: jest.fn(),
    });
    mockedUseActorSession.mockReturnValue({
      personId: 'treasurer-1',
      branchId: 'branch-1',
      role: 'TREASURER',
      authToken: 'token-3',
    });
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/people/treasurer-1')) {
        return jsonResponse({
          id: 'treasurer-1',
          branchId: 'branch-1',
          firstName: 'Kwame',
          lastName: 'Boateng',
          phone: null,
          email: null,
          dateOfBirth: null,
          address: null,
          lifecycleStage: 'WORKER',
          guardianPersonId: null,
          createdAt: '',
          updatedAt: '',
        });
      }
      return jsonResponse(null);
    }) as unknown as typeof fetch;

    renderScreen();

    await waitFor(() => expect(screen.getByText('Kwame Boateng')).toBeTruthy());
    expect(screen.getByText('Treasurer')).toBeTruthy();
    expect(screen.queryByText('Bacenta')).toBeNull();
    expect(screen.queryByText('Basonta')).toBeNull();
    // No /groups fetch should ever fire for a role with no group id.
    expect((global.fetch as jest.Mock).mock.calls.some(([url]: [string]) => url.includes('/groups/'))).toBe(false);
  });

  it('Sign Out calls logout()', () => {
    const logout = jest.fn();
    mockedUseAuth.mockReturnValue({
      state: {
        status: 'authenticated',
        accessToken: 'token-1',
        actor: { personId: 'shepherd-1', role: 'BACENTA_LEADER', branchId: 'branch-1', bacentaId: 'bacenta-1' },
      },
      devUsers: [],
      loginAsDevUser: jest.fn(),
      logout,
    });
    mockedUseActorSession.mockReturnValue({
      personId: 'shepherd-1',
      branchId: 'branch-1',
      role: 'BACENTA_LEADER',
      bacentaGroupId: 'bacenta-1',
      authToken: 'token-1',
    });
    global.fetch = jest.fn(() => jsonResponse(null)) as unknown as typeof fetch;

    renderScreen();
    fireEvent.press(screen.getByTestId('profile-sign-out'));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders nothing if somehow reached while unauthenticated', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });
    mockedUseActorSession.mockReturnValue({
      personId: 'shepherd-1',
      branchId: 'branch-1',
      role: 'BACENTA_LEADER',
      bacentaGroupId: 'bacenta-1',
      authToken: 'token-1',
    });
    global.fetch = jest.fn(() => jsonResponse(null)) as unknown as typeof fetch;

    const { toJSON } = renderScreen();
    expect(toJSON()).toBeNull();
  });
});
