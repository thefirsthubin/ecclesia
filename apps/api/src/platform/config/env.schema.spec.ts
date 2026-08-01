import { validateEnv } from './env.schema';

const VALID_DATABASE_URL = 'postgresql://ecclesia:ecclesia@localhost:5432/ecclesia_dev';

describe('validateEnv', () => {
  it('applies documented defaults when only the required DATABASE_URL is set', () => {
    const config = validateEnv({ DATABASE_URL: VALID_DATABASE_URL });
    expect(config).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      API_DOCS_ENABLED: true,
      DATABASE_URL: VALID_DATABASE_URL,
    });
  });

  it('coerces PORT from a string, as process.env always provides', () => {
    const config = validateEnv({ PORT: '4100', DATABASE_URL: VALID_DATABASE_URL });
    expect(config.PORT).toBe(4100);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number', DATABASE_URL: VALID_DATABASE_URL })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects an unrecognised NODE_ENV rather than silently accepting it', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', DATABASE_URL: VALID_DATABASE_URL })).toThrow(/NODE_ENV/);
  });

  it('rejects an unrecognised LOG_LEVEL', () => {
    expect(() => validateEnv({ LOG_LEVEL: 'verbose', DATABASE_URL: VALID_DATABASE_URL })).toThrow(/LOG_LEVEL/);
  });

  it('parses API_DOCS_ENABLED=false to a real boolean, not the truthy string "false"', () => {
    const config = validateEnv({ API_DOCS_ENABLED: 'false', DATABASE_URL: VALID_DATABASE_URL });
    expect(config.API_DOCS_ENABLED).toBe(false);
  });

  it('rejects a missing DATABASE_URL - the process must refuse to boot without one', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not a postgresql:// or postgres:// connection string', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://localhost/ecclesia' })).toThrow(/DATABASE_URL/);
  });

  it('accepts a postgres:// (shorthand scheme) DATABASE_URL, not only postgresql://', () => {
    const config = validateEnv({ DATABASE_URL: 'postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev' });
    expect(config.DATABASE_URL).toBe('postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev');
  });

  it('accepts a fully specified, valid environment unchanged', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: 'false',
      DATABASE_URL: VALID_DATABASE_URL,
    });
    expect(config).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: false,
      DATABASE_URL: VALID_DATABASE_URL,
    });
  });
});
