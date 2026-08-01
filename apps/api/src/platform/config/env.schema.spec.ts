import { validateEnv } from './env.schema';

describe('validateEnv', () => {
  it('applies documented defaults when no environment variables are set', () => {
    const config = validateEnv({});
    expect(config).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      API_DOCS_ENABLED: true,
    });
  });

  it('coerces PORT from a string, as process.env always provides', () => {
    const config = validateEnv({ PORT: '4100' });
    expect(config.PORT).toBe(4100);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number' })).toThrow(/Invalid environment configuration/);
  });

  it('rejects an unrecognised NODE_ENV rather than silently accepting it', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects an unrecognised LOG_LEVEL', () => {
    expect(() => validateEnv({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });

  it('parses API_DOCS_ENABLED=false to a real boolean, not the truthy string "false"', () => {
    const config = validateEnv({ API_DOCS_ENABLED: 'false' });
    expect(config.API_DOCS_ENABLED).toBe(false);
  });

  it('accepts a fully specified, valid environment unchanged', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: 'false',
    });
    expect(config).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: false,
    });
  });
});
