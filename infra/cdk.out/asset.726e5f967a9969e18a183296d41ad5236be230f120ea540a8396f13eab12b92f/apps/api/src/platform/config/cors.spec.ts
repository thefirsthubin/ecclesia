import { computeCorsOrigins } from './cors';

describe('computeCorsOrigins', () => {
  it('parses a single explicit CORS_ORIGIN', () => {
    expect(computeCorsOrigins({ CORS_ORIGIN: 'https://admin.example.org' })).toEqual(['https://admin.example.org']);
  });

  it('parses a comma-separated CORS_ORIGIN list, trimming whitespace', () => {
    expect(computeCorsOrigins({ CORS_ORIGIN: 'https://a.example.org, https://b.example.org ,https://c.example.org' })).toEqual([
      'https://a.example.org',
      'https://b.example.org',
      'https://c.example.org',
    ]);
  });

  it('defaults to the web-admin dev server origin when unset and NODE_ENV=development', () => {
    expect(computeCorsOrigins({ NODE_ENV: 'development' })).toEqual(['http://localhost:4200']);
  });

  it('returns undefined (CORS disabled) when unset and NODE_ENV=production', () => {
    expect(computeCorsOrigins({ NODE_ENV: 'production' })).toBeUndefined();
  });

  it('returns undefined (CORS disabled) when unset and NODE_ENV=test', () => {
    expect(computeCorsOrigins({ NODE_ENV: 'test' })).toBeUndefined();
  });

  it('honors an explicit CORS_ORIGIN even in production', () => {
    expect(computeCorsOrigins({ CORS_ORIGIN: 'https://admin.example.org', NODE_ENV: 'production' })).toEqual([
      'https://admin.example.org',
    ]);
  });

  it('falls back to the development default when CORS_ORIGIN is only whitespace/commas', () => {
    expect(computeCorsOrigins({ CORS_ORIGIN: ' , ,', NODE_ENV: 'development' })).toEqual(['http://localhost:4200']);
  });
});
