import { createBranchConfiguration, updateBranchConfiguration } from './useConfigurationData';

/** `[Branch Configuration milestone]` */
describe('createBranchConfiguration', () => {
  it('POSTs to /platform/configuration with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'config-1' }) });
    global.fetch = fetchMock;

    await createBranchConfiguration('token', { poimenGateEnabled: true });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/platform/configuration');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ poimenGateEnabled: true });
  });

  it('rejects with an ApiError carrying the server-provided conflict reason on a 409', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: "A Configuration already exists for Branch 'branch-1'" }),
    });

    const error = (await createBranchConfiguration('token', {}).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });
});

describe('updateBranchConfiguration', () => {
  it('PATCHes to /platform/configuration with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'config-1' }) });
    global.fetch = fetchMock;

    await updateBranchConfiguration('token', { poimenGateEnabled: false });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/platform/configuration');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ poimenGateEnabled: false });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'platform.configuration.update' to role 'RESIDENT_PASTOR'" }),
    });

    const error = (await updateBranchConfiguration('token', { poimenGateEnabled: true }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('platform.configuration.update') });
  });
});
