import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ThemeProvider, ToastProvider } from '@ecclesia/ui-web';

import { RouterProvider } from '../../router/router';
import { NewPersonForm } from './NewPersonForm';

const mockUseAuth = jest.fn();
jest.mock('../../auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function person(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    branchId: 'branch-1',
    firstName: 'Ama',
    lastName: 'Owusu',
    phone: null,
    email: null,
    dateOfBirth: null,
    address: null,
    lifecycleStage: 'VISITOR',
    guardianPersonId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderForm(onCreated = jest.fn(), onCancel = jest.fn()) {
  mockUseAuth.mockReturnValue({
    state: { status: 'authenticated', accessToken: 'token', actor: { personId: 'admin-1', role: 'ADMIN', branchId: 'branch-1' } },
  });
  const utils = render(
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider>
          <NewPersonForm onCreated={onCreated} onCancel={onCancel} />
        </RouterProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
  return { ...utils, onCreated, onCancel };
}

function fillRequiredFields() {
  fireEvent.change(screen.getByTestId('new-person-first-name'), { target: { value: 'Ama' } });
  fireEvent.change(screen.getByTestId('new-person-last-name'), { target: { value: 'Owusu' } });
}

afterEach(() => jest.clearAllMocks());

describe('NewPersonForm', () => {
  it('disables Create Person until first and last name are filled', () => {
    renderForm();
    expect(screen.getByTestId('new-person-submit')).toBeDisabled();

    fillRequiredFields();
    expect(screen.getByTestId('new-person-submit')).not.toBeDisabled();
  });

  it('creates a Person directly when there is no duplicate, and notifies the caller', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/people')) {
        return Promise.resolve({ ok: true, json: async () => person() });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock;

    const { onCreated } = renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({ firstName: 'Ama', lastName: 'Owusu', overrideDuplicateCheck: false });
  });

  it('shows the duplicate-candidate review modal on a 409 and loads each candidate detail', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/people')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            message: 'FR-PPL-02: likely duplicate Person record(s) found.',
            candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
          }),
        });
      }
      if (url.includes('/people/c1')) {
        return Promise.resolve({ ok: true, json: async () => person({ id: 'c1' }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock;

    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(screen.getByTestId('duplicate-candidate-modal')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Same name and phone number')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('view-candidate-c1')).toBeInTheDocument());
  });

  it('lets the user create anyway after reviewing candidates (overrideDuplicateCheck: true)', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/people')) {
        const body = JSON.parse(init.body as string);
        if (!body.overrideDuplicateCheck) {
          return Promise.resolve({
            ok: false,
            status: 409,
            json: async () => ({
              message: 'FR-PPL-02: likely duplicate Person record(s) found.',
              candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => person({ id: 'p2' }) });
      }
      if (url.includes('/people/c1')) {
        return Promise.resolve({ ok: true, json: async () => person({ id: 'c1' }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock;

    const { onCreated } = renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(screen.getByTestId('duplicate-candidate-modal')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('new-person-create-anyway'));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    const overrideCall = fetchMock.mock.calls.find(
      ([, init]: [string, RequestInit?]) => init?.method === 'POST' && JSON.parse(init.body as string).overrideDuplicateCheck === true,
    );
    expect(overrideCall).toBeDefined();
  });

  it('navigates to the existing record and cancels the form when the user views a candidate', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/people')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            message: 'FR-PPL-02: likely duplicate Person record(s) found.',
            candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
          }),
        });
      }
      if (url.includes('/people/c1')) {
        return Promise.resolve({ ok: true, json: async () => person({ id: 'c1', firstName: 'Existing', lastName: 'Person' }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock;

    const { onCancel } = renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(screen.getByTestId('view-candidate-c1')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('view-candidate-c1'));

    expect(onCancel).toHaveBeenCalled();
    expect(window.location.pathname).toBe('/people/c1');
  });

  it('shows an inline error for a non-duplicate failure (e.g. a 500)', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: 'boom' }) });

    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(screen.getByText(/failed with status 500|boom/)).toBeInTheDocument());
  });

  it('shows a retryable error when a candidate detail fails to load', async () => {
    const fetchMock = jest.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'POST' && url.includes('/people')) {
        return Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({
            message: 'FR-PPL-02: likely duplicate Person record(s) found.',
            candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
          }),
        });
      }
      if (url.includes('/people/c1')) {
        return Promise.resolve({ ok: false, status: 500, json: async () => ({ message: 'boom' }) });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    global.fetch = fetchMock;

    renderForm();
    fillRequiredFields();
    fireEvent.click(screen.getByTestId('new-person-submit'));

    await waitFor(() => expect(screen.getByText("Couldn't load this record")).toBeInTheDocument());
  });
});
