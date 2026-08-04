import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '@ecclesia/ui-native';

import { ProfileScreen } from './ProfileScreen';
import * as authContext from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext', () => ({
  ...jest.requireActual('../../auth/AuthContext'),
  useAuth: jest.fn(),
}));
const mockedUseAuth = authContext.useAuth as jest.Mock;

jest.mock('../../lib/session', () => ({
  useSession: () => ({
    personId: 'shepherd-1',
    branchId: 'branch-1',
    bacentaGroupId: 'bacenta-1',
    authToken: 'token-1',
  }),
}));

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
          type: 'BACENTA',
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
    global.fetch = jest.fn(() => jsonResponse(null)) as unknown as typeof fetch;

    renderScreen();
    fireEvent.press(screen.getByTestId('profile-sign-out'));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders nothing if somehow reached while unauthenticated', () => {
    mockedUseAuth.mockReturnValue({ state: { status: 'unauthenticated' }, devUsers: [], loginAsDevUser: jest.fn(), logout: jest.fn() });
    global.fetch = jest.fn(() => jsonResponse(null)) as unknown as typeof fetch;

    const { toJSON } = renderScreen();
    expect(toJSON()).toBeNull();
  });
});
