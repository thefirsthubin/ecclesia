import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { ThemeProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { BasontaDirectoryPage } from './BasontaDirectoryPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function group(overrides: Record<string, unknown> = {}) {
  return {
    id: 'group-1',
    branchId: 'branch-1',
    type: 'MINISTRY',
    name: 'Media Basonta',
    meetingSchedule: null,
    meetingLocation: null,
    category: 'Technical',
    lifecycleStatus: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <ThemeProvider>
      <RouterProvider>
        <BasontaDirectoryPage />
      </RouterProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

function bacenta(overrides: Record<string, unknown> = {}) {
  return group({ id: 'group-2', type: 'PASTORAL_CARE', name: 'Grace Bacenta', category: null, ...overrides });
}

describe('BasontaDirectoryPage', () => {
  it('fetches GET /groups (both types, no filter) and renders each Group with a type Badge', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [group(), bacenta()] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(screen.getByText('Media Basonta')).toBeInTheDocument());
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Grace Bacenta')).toBeInTheDocument();
    expect(screen.getByText('Basonta')).toBeInTheDocument();
    expect(screen.getByText('Bacenta')).toBeInTheDocument();
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith('/groups')).toBe(true);
  });

  it('links both a Basonta (MINISTRY) row and a Bacenta (PASTORAL_CARE) row to their own Group detail page', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [group(), bacenta()] });

    renderPage();

    await waitFor(() => expect(screen.getByText('Media Basonta')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Media Basonta' })).toHaveAttribute('href', '/ministry/group-1');
    expect(screen.getByRole('link', { name: 'Grace Bacenta' })).toHaveAttribute('href', '/ministry/group-2');
  });

  it('shows an empty state when no Groups exist yet', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Groups yet')).toBeInTheDocument());
  });

  it('shows a retryable error state when the directory request fails (e.g. an Assistant Pastor\'s structural 403)', async () => {
    mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
    global.fetch = jest.fn().mockRejectedValue(new Error('network unavailable in test'));

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load the Group directory")).toBeInTheDocument());
  });

  /**
   * `[Group CRUD milestone]` No `state.actor` role check is asserted here -
   * `createGroup`/`updateGroup` have no client-side authorization gate of
   * their own (same reasoning as every other action this session).
   */
  describe('Create Group', () => {
    it('POSTs the entered fields, then refetches and shows the newly created Group in the directory', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      let listCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/groups') && init?.method === 'POST') {
          return Promise.resolve({ ok: true, json: async () => bacenta({ id: 'group-new', name: 'New Life Bacenta' }) });
        }
        if (url.endsWith('/groups')) {
          listCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => (listCallCount === 1 ? [] : [bacenta({ id: 'group-new', name: 'New Life Bacenta' })]) });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No Groups yet')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));

      const confirmButton = screen.getByRole('button', { name: 'Confirm create' });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Life Bacenta' } });
      expect(confirmButton).toBeEnabled();
      fireEvent.click(confirmButton);

      await waitForElementToBeRemoved(() => screen.queryByTestId('group-create-form'));

      const postCall = fetchMock.mock.calls.find(([url, init]) => (url as string).endsWith('/groups') && (init as RequestInit)?.method === 'POST');
      expect(postCall).toBeDefined();
      expect(JSON.parse((postCall as [string, RequestInit])[1].body as string)).toEqual({
        type: 'PASTORAL_CARE',
        name: 'New Life Bacenta',
        meetingSchedule: undefined,
        meetingLocation: undefined,
        category: undefined,
      });

      await waitFor(() => expect(screen.getByText('New Life Bacenta')).toBeInTheDocument());
    });

    it('shows the server-provided denial reason inline and keeps the form open on a 403', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.endsWith('/groups') && init?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 403,
            json: async () => ({ message: "No Role Assignment grants 'people.group.create' to role 'ASSISTANT_PASTOR'" }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => [] });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('No Groups yet')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Life Bacenta' } });
      fireEvent.click(screen.getByRole('button', { name: 'Confirm create' }));

      await waitFor(() => expect(screen.getByText("No Role Assignment grants 'people.group.create' to role 'ASSISTANT_PASTOR'")).toBeInTheDocument());
      expect(screen.getByTestId('group-create-form')).toBeInTheDocument();
    });

    it('cancels the form without sending a request', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

      renderPage();
      await waitFor(() => expect(screen.getByText('No Groups yet')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Create Group' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('group-create-form')).not.toBeInTheDocument();
    });
  });

  describe('Edit Group', () => {
    it('pre-fills the edit form from the existing Group, PATCHes the edits, then refetches and shows the updated values on a fresh read', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      const updated = bacenta({ name: 'Grace Bacenta (Renamed)', lifecycleStatus: 'ARCHIVED' });
      let listCallCount = 0;
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/groups/group-2') && init?.method === 'PATCH') {
          return Promise.resolve({ ok: true, json: async () => updated });
        }
        if (url.endsWith('/groups')) {
          listCallCount += 1;
          return Promise.resolve({ ok: true, json: async () => [listCallCount === 1 ? bacenta() : updated] });
        }
        return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Group: Grace Bacenta' }));

      const nameInput = await screen.findByDisplayValue('Grace Bacenta');
      fireEvent.change(nameInput, { target: { value: 'Grace Bacenta (Renamed)' } });
      fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'ARCHIVED' } });
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitForElementToBeRemoved(() => screen.queryByTestId('group-edit-form'));

      const patchCall = fetchMock.mock.calls.find(([url, init]) => (url as string).includes('/groups/group-2') && (init as RequestInit)?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(JSON.parse((patchCall as [string, RequestInit])[1].body as string)).toMatchObject({
        name: 'Grace Bacenta (Renamed)',
        lifecycleStatus: 'ARCHIVED',
      });

      await waitFor(() => expect(screen.getByText('Grace Bacenta (Renamed)')).toBeInTheDocument());
      expect(screen.getByText('Archived')).toBeInTheDocument();
    });

    it('shows the server-provided error inline and keeps the form open on failure', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/groups/group-2') && init?.method === 'PATCH') {
          return Promise.resolve({ ok: false, status: 400, json: async () => ({ message: 'At least one field must be provided' }) });
        }
        return Promise.resolve({ ok: true, json: async () => [bacenta()] });
      });
      global.fetch = fetchMock;

      renderPage();
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Group: Grace Bacenta' }));
      await screen.findByTestId('group-edit-form');
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(screen.getByText('At least one field must be provided')).toBeInTheDocument());
      expect(screen.getByTestId('group-edit-form')).toBeInTheDocument();
    });

    it('cancels the edit form without sending a request', async () => {
      mockUseAuth.mockReturnValue({ state: { status: 'authenticated', accessToken: 'token' } });
      global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [bacenta()] });

      renderPage();
      await waitFor(() => expect(screen.getByText('Grace Bacenta')).toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: 'Edit Group: Grace Bacenta' }));
      await screen.findByTestId('group-edit-form');
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByTestId('group-edit-form')).not.toBeInTheDocument();
    });
  });
});
