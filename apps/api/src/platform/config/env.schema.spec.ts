import { validateEnv } from './env.schema';

const VALID_DATABASE_URL = 'postgresql://ecclesia:ecclesia@localhost:5432/ecclesia_dev';
const VALID_COGNITO_ENV = {
  COGNITO_USER_POOL_ID: 'us-east-1_AbC123dEf',
  COGNITO_CLIENT_ID: '1example23456789example',
  COGNITO_REGION: 'us-east-1',
};
const VALID_ENV = { DATABASE_URL: VALID_DATABASE_URL, ...VALID_COGNITO_ENV };

describe('validateEnv', () => {
  it('applies documented defaults when only the required variables are set', () => {
    const config = validateEnv(VALID_ENV);
    expect(config).toEqual({
      NODE_ENV: 'development',
      PORT: 3000,
      LOG_LEVEL: 'info',
      API_DOCS_ENABLED: true,
      ...VALID_ENV,
    });
  });

  it('coerces PORT from a string, as process.env always provides', () => {
    const config = validateEnv({ PORT: '4100', ...VALID_ENV });
    expect(config.PORT).toBe(4100);
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number', ...VALID_ENV })).toThrow(/Invalid environment configuration/);
  });

  it('rejects an unrecognised NODE_ENV rather than silently accepting it', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging', ...VALID_ENV })).toThrow(/NODE_ENV/);
  });

  it('rejects an unrecognised LOG_LEVEL', () => {
    expect(() => validateEnv({ LOG_LEVEL: 'verbose', ...VALID_ENV })).toThrow(/LOG_LEVEL/);
  });

  it('parses API_DOCS_ENABLED=false to a real boolean, not the truthy string "false"', () => {
    const config = validateEnv({ API_DOCS_ENABLED: 'false', ...VALID_ENV });
    expect(config.API_DOCS_ENABLED).toBe(false);
  });

  it('rejects a missing DATABASE_URL - the process must refuse to boot without one', () => {
    expect(() => validateEnv(VALID_COGNITO_ENV)).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not a postgresql:// or postgres:// connection string', () => {
    expect(() => validateEnv({ ...VALID_COGNITO_ENV, DATABASE_URL: 'mysql://localhost/ecclesia' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('accepts a postgres:// (shorthand scheme) DATABASE_URL, not only postgresql://', () => {
    const config = validateEnv({
      ...VALID_COGNITO_ENV,
      DATABASE_URL: 'postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev',
    });
    expect(config.DATABASE_URL).toBe('postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev');
  });

  it('rejects a missing COGNITO_USER_POOL_ID - the process must refuse to boot without one', () => {
    expect(() =>
      validateEnv({ DATABASE_URL: VALID_DATABASE_URL, COGNITO_CLIENT_ID: 'x', COGNITO_REGION: 'us-east-1' }),
    ).toThrow(/COGNITO_USER_POOL_ID/);
  });

  it('rejects a COGNITO_USER_POOL_ID that does not look like <region>_<poolId>', () => {
    expect(() => validateEnv({ ...VALID_ENV, COGNITO_USER_POOL_ID: 'not-a-valid-pool-id' })).toThrow(
      /COGNITO_USER_POOL_ID/,
    );
  });

  it('rejects a missing COGNITO_CLIENT_ID', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: VALID_DATABASE_URL,
        COGNITO_USER_POOL_ID: VALID_COGNITO_ENV.COGNITO_USER_POOL_ID,
        COGNITO_REGION: 'us-east-1',
      }),
    ).toThrow(/COGNITO_CLIENT_ID/);
  });

  it('rejects a missing COGNITO_REGION', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: VALID_DATABASE_URL,
        COGNITO_USER_POOL_ID: VALID_COGNITO_ENV.COGNITO_USER_POOL_ID,
        COGNITO_CLIENT_ID: VALID_COGNITO_ENV.COGNITO_CLIENT_ID,
      }),
    ).toThrow(/COGNITO_REGION/);
  });

  it('accepts a fully specified, valid environment unchanged', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: 'false',
      ...VALID_ENV,
    });
    expect(config).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      LOG_LEVEL: 'warn',
      API_DOCS_ENABLED: false,
      ...VALID_ENV,
    });
  });
});
