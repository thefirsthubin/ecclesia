import { createGroup, updateGroup } from './useMinistryData';

/** `[Group CRUD milestone]` */
describe('createGroup', () => {
  it('POSTs to /groups with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'group-1' }) });
    global.fetch = fetchMock;

    await createGroup('token', { type: 'PASTORAL_CARE', name: 'Grace Bacenta' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.endsWith('/groups')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ type: 'PASTORAL_CARE', name: 'Grace Bacenta' });
  });

  it('rejects with an ApiError carrying the server-provided authorization/denial reason', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: "No Role Assignment grants 'people.group.create' to role 'ASSISTANT_PASTOR'" }),
    });

    const error = (await createGroup('token', { type: 'PASTORAL_CARE', name: 'Grace Bacenta' }).catch((e) => e)) as {
      status: number;
      body: unknown;
    };

    expect(error.status).toBe(403);
    expect(error.body).toMatchObject({ message: expect.stringContaining('people.group.create') });
  });
});

describe('updateGroup', () => {
  it('PATCHes to /groups/:id with the given input', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'group-1' }) });
    global.fetch = fetchMock;

    await updateGroup('token', 'group-1', { name: 'Renamed Bacenta', lifecycleStatus: 'ARCHIVED' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/groups/group-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Renamed Bacenta', lifecycleStatus: 'ARCHIVED' });
  });

  it('rejects with an ApiError carrying the server-provided validation reason on a 400', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'At least one field must be provided' }),
    });

    const error = (await updateGroup('token', 'group-1', { name: 'x' }).catch((e) => e)) as { status: number; body: unknown };

    expect(error.status).toBe(400);
    expect(error.body).toMatchObject({ message: 'At least one field must be provided' });
  });
});
