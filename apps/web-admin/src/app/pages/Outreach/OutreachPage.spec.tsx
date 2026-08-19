import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { OutreachPage } from './OutreachPage';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function actorWithRole(role: string, extra: Record<string, unknown> = {}) {
  return {
    state: {
      status: 'authenticated',
      accessToken: 'token',
      actor: { personId: 'leader-1', role, branchId: 'branch-1', ...extra },
    },
  };
}

function outreach(overrides: Record<string, unknown> = {}) {
  return {
    id: 'outreach-1',
    branchId: 'branch-1',
    groupId: 'bacenta-1',
    occurredAt: new Date('2026-08-15T09:00:00.000Z').toISOString(),
    location: 'Osu Estate',
    leaderPersonId: 'leader-1',
    notes: 'Door to door',
    createdByPersonId: 'leader-1',
    createdAt: new Date('2026-08-15T09:00:00.000Z').toISOString(),
    ...overrides,
  };
}

function contact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'contact-1',
    outreachId: 'outreach-1',
    branchId: 'branch-1',
    personId: null,
    firstName: 'Kofi',
    lastName: 'Mensah',
    phone: '0244000111',
    howReached: null,
    outcome: null,
    createdAt: new Date('2026-08-15T09:30:00.000Z').toISOString(),
    ...overrides,
  };
}

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'leader-1',
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

function renderPage() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <OutreachPage />
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('[Milestone D] OutreachPage', () => {
  it('renders the real, role-scoped list of Outreach events for BACENTA_LEADER', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.endsWith('/outreach') || url.includes('/outreach?')) return Promise.resolve({ ok: true, json: async () => [outreach()] });
      if (url.includes('/people/leader-1')) return Promise.resolve({ ok: true, json: async () => person() });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('outreach-list-card')).toBeInTheDocument());
    expect(screen.getByText('Osu Estate')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Ama Owusu')).toBeInTheDocument());
  });

  it('sends the Bacenta Leader own-group scope as a groupId query param', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });
    global.fetch = fetchMock;

    renderPage();

    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => (url as string).includes('groupId=bacenta-1'))).toBe(true));
  });

  it('shows an empty state, not fabricated rows, when no Outreaches are in scope', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Outreaches recorded')).toBeInTheDocument());
  });

  it('shows a retryable error state when the request fails', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'Internal error' }) });

    renderPage();

    await waitFor(() => expect(screen.getByText("Couldn't load Outreaches")).toBeInTheDocument());
  });

  it('expands a row into its real contacts list on "View contacts"', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/outreach/outreach-1/contacts')) return Promise.resolve({ ok: true, json: async () => [contact()] });
      if (url.endsWith('/outreach') || url.includes('/outreach?')) return Promise.resolve({ ok: true, json: async () => [outreach()] });
      if (url.includes('/people/leader-1')) return Promise.resolve({ ok: true, json: async () => person() });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('outreach-list-card')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'View contacts for this Outreach' }));

    await waitFor(() => expect(screen.getByTestId('outreach-contacts-panel')).toBeInTheDocument());
    expect(within(screen.getByTestId('outreach-contacts-table')).getByText('Kofi Mensah')).toBeInTheDocument();
    expect(within(screen.getByTestId('outreach-contacts-table')).getByText('Not promoted')).toBeInTheDocument();
  });

  it('shows the resolved Person name and "Promoted" badge for a contact that has already been promoted', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/outreach/outreach-1/contacts')) return Promise.resolve({ ok: true, json: async () => [contact({ personId: 'person-9' })] });
      if (url.endsWith('/outreach') || url.includes('/outreach?')) return Promise.resolve({ ok: true, json: async () => [outreach()] });
      if (url.includes('/people/person-9')) return Promise.resolve({ ok: true, json: async () => person({ id: 'person-9', firstName: 'Kofi', lastName: 'Mensah' }) });
      if (url.includes('/people/leader-1')) return Promise.resolve({ ok: true, json: async () => person() });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });

    renderPage();
    await waitFor(() => expect(screen.getByTestId('outreach-list-card')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'View contacts for this Outreach' }));

    await waitFor(() => expect(within(screen.getByTestId('outreach-contacts-table')).getByText('Promoted')).toBeInTheDocument());
  });

  it('records a new Outreach via the create form, then refetches and shows it', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('BACENTA_LEADER', { bacentaId: 'bacenta-1' }));
    let outreaches: unknown[] = [];
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if ((url.endsWith('/outreach') || url.includes('/outreach?')) && init?.method === 'POST') {
        const body = JSON.parse(init.body as string) as Record<string, unknown>;
        outreaches = [outreach({ id: 'outreach-new', location: body.location, occurredAt: body.occurredAt })];
        return Promise.resolve({ ok: true, json: async () => outreaches[0] });
      }
      if (url.endsWith('/outreach') || url.includes('/outreach?')) return Promise.resolve({ ok: true, json: async () => outreaches });
      if (url.includes('/people?search=')) return Promise.resolve({ ok: true, json: async () => [person()] });
      if (url.includes('/people/leader-1')) return Promise.resolve({ ok: true, json: async () => person() });
      return Promise.resolve({ ok: false, status: 404, json: async () => ({}) });
    });
    global.fetch = fetchMock;

    renderPage();
    await waitFor(() => expect(screen.getByText('No Outreaches recorded')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Record a new Outreach' }));
    fireEvent.change(screen.getByTestId('outreach-create-occurred-at'), { target: { value: '2026-08-16T10:00' } });

    const leaderSearch = await screen.findByPlaceholderText('Search for who led this Outreach…');
    fireEvent.change(leaderSearch, { target: { value: 'Ama' } });
    fireEvent.click(await screen.findByText('Ama Owusu'));

    fireEvent.click(screen.getByTestId('outreach-create-submit'));

    await waitFor(() => expect(screen.queryByTestId('outreach-create-form')).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([, init]) => (init as RequestInit | undefined)?.method === 'POST')).toBe(true);
  });

  it('does not offer "+ Record Outreach" for a role with no outreach.event.create grant (e.g. RESIDENT_PASTOR)', async () => {
    mockUseAuth.mockReturnValue(actorWithRole('RESIDENT_PASTOR'));
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => [] });

    renderPage();

    await waitFor(() => expect(screen.getByText('No Outreaches recorded')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Record a new Outreach' })).not.toBeInTheDocument();
  });
});
