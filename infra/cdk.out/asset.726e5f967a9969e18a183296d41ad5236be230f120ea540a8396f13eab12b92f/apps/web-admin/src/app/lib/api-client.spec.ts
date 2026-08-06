import { ApiError, apiGet, apiPatch, apiPost } from './api-client';

/**
 * `[People Intake milestone]` First test file for this module - prior
 * sprints only exercised it indirectly through page-level specs
 * (`global.fetch` mocks in `PeopleListPage.spec.tsx` etc.). This file
 * targets the one behavior added for that milestone: `ApiError` now
 * captures the parsed response body (needed to read `candidates` off a
 * `POST /people` 409), while every pre-existing call shape keeps working
 * unchanged.
 */
afterEach(() => jest.clearAllMocks());

describe('apiGet', () => {
  it('resolves with the parsed JSON body on a 2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p1' }) });

    await expect(apiGet('/people/p1')).resolves.toEqual({ id: 'p1' });
  });

  it('throws an ApiError with status and no body when the response has no JSON body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => {
        throw new Error('no body');
      },
    });

    await expect(apiGet('/people/missing')).rejects.toMatchObject({ status: 404, body: undefined });
  });

  it('captures the parsed JSON error body on a non-2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'conflict', candidates: [{ candidateId: 'c1' }] }),
    });

    const error = (await apiGet('/people/p1').catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.body).toEqual({ message: 'conflict', candidates: [{ candidateId: 'c1' }] });
  });
});

describe('apiPost', () => {
  it('captures the parsed JSON error body on a 409 (FR-PPL-02 duplicate resolution shape)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        message: "FR-PPL-02: likely duplicate Person record(s) found. Resubmit with overrideDuplicateCheck=true to create anyway.",
        candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE', reason: 'same name and phone' }],
      }),
    });
    global.fetch = fetchMock;

    const error = (await apiPost('/people', { firstName: 'Ama', lastName: 'Owusu' }).catch((e) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.body).toMatchObject({
      candidates: [{ candidateId: 'c1', matchedOn: 'NAME_AND_PHONE' }],
    });
  });

  it('resolves with the parsed JSON body on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 'p1' }) });

    await expect(apiPost('/people', { firstName: 'Ama', lastName: 'Owusu' })).resolves.toEqual({ id: 'p1' });
  });
});

describe('apiPatch', () => {
  it('captures the parsed JSON error body on a non-2xx response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'bad request' }),
    });

    const error = (await apiPatch('/people/p1', {}).catch((e) => e)) as ApiError;
    expect(error.body).toEqual({ message: 'bad request' });
  });
});
