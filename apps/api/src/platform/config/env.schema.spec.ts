import { validateEnv } from './env.schema';

const VALID_DATABASE_URL = 'postgresql://ecclesia:ecclesia@localhost:5432/ecclesia_dev';
// `[Row-Level Security sprint]` `APP_DATABASE_URL` is unconditionally
// required by `env.schema.ts` (no `.default()`, no `AUTH_MODE`-style
// conditional) - every env fixture in this file that expects a
// successful `validateEnv()` call needs it, the same way every one
// already needs `DATABASE_URL`. Matches `.env.example`'s own example
// value for the `ecclesia_app` role.
const VALID_APP_DATABASE_URL = 'postgresql://ecclesia_app:ecclesia_app@localhost:5432/ecclesia_dev';
const VALID_COGNITO_ENV = {
  COGNITO_USER_POOL_ID: 'us-east-1_AbC123dEf',
  COGNITO_CLIENT_ID: '1example23456789example',
  COGNITO_REGION: 'us-east-1',
};
// `AUTH_MODE: 'cognito'` is explicit throughout this file's pre-existing
// (Sprint 1.4) test cases - Development Authentication sprint made
// COGNITO_* conditionally required (only when the effective mode is
// `'cognito'`), so every test whose *intent* is "Cognito fields are
// required" now has to say so explicitly rather than relying on
// NODE_ENV's default inferring it incidentally. The inference behavior
// itself gets its own dedicated `describe('AUTH_MODE')` block below.
const VALID_ENV = {
  DATABASE_URL: VALID_DATABASE_URL,
  APP_DATABASE_URL: VALID_APP_DATABASE_URL,
  AUTH_MODE: 'cognito',
  ...VALID_COGNITO_ENV,
};

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
    expect(() => validateEnv({ AUTH_MODE: 'cognito', APP_DATABASE_URL: VALID_APP_DATABASE_URL, ...VALID_COGNITO_ENV })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects a missing APP_DATABASE_URL - the process must refuse to boot without one', () => {
    expect(() => validateEnv({ AUTH_MODE: 'cognito', DATABASE_URL: VALID_DATABASE_URL, ...VALID_COGNITO_ENV })).toThrow(
      /APP_DATABASE_URL/,
    );
  });

  it('rejects a DATABASE_URL that is not a postgresql:// or postgres:// connection string', () => {
    expect(() =>
      validateEnv({
        AUTH_MODE: 'cognito',
        ...VALID_COGNITO_ENV,
        DATABASE_URL: 'mysql://localhost/ecclesia',
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it('accepts a postgres:// (shorthand scheme) DATABASE_URL, not only postgresql://', () => {
    const config = validateEnv({
      AUTH_MODE: 'cognito',
      ...VALID_COGNITO_ENV,
      DATABASE_URL: 'postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev',
      APP_DATABASE_URL: VALID_APP_DATABASE_URL,
    });
    expect(config.DATABASE_URL).toBe('postgres://ecclesia:ecclesia@localhost:5432/ecclesia_dev');
  });

  it('rejects a missing COGNITO_USER_POOL_ID when AUTH_MODE=cognito', () => {
    expect(() =>
      validateEnv({
        AUTH_MODE: 'cognito',
        DATABASE_URL: VALID_DATABASE_URL,
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
        COGNITO_CLIENT_ID: 'x',
        COGNITO_REGION: 'us-east-1',
      }),
    ).toThrow(/COGNITO_USER_POOL_ID/);
  });

  it('rejects a COGNITO_USER_POOL_ID that does not look like <region>_<poolId>', () => {
    expect(() => validateEnv({ ...VALID_ENV, COGNITO_USER_POOL_ID: 'not-a-valid-pool-id' })).toThrow(
      /COGNITO_USER_POOL_ID/,
    );
  });

  it('rejects a missing COGNITO_CLIENT_ID when AUTH_MODE=cognito', () => {
    expect(() =>
      validateEnv({
        AUTH_MODE: 'cognito',
        DATABASE_URL: VALID_DATABASE_URL,
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
        COGNITO_USER_POOL_ID: VALID_COGNITO_ENV.COGNITO_USER_POOL_ID,
        COGNITO_REGION: 'us-east-1',
      }),
    ).toThrow(/COGNITO_CLIENT_ID/);
  });

  it('rejects a missing COGNITO_REGION when AUTH_MODE=cognito', () => {
    expect(() =>
      validateEnv({
        AUTH_MODE: 'cognito',
        DATABASE_URL: VALID_DATABASE_URL,
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
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

/**
 * Development Authentication sprint. `AUTH_MODE`'s own default-inference
 * and safety-refusal rules (`../auth/auth-mode.ts`'s `computeAuthMode`/
 * `assertAuthModeIsSafe`, surfaced here as this schema's `.superRefine`/
 * `.transform`).
 */
describe('AUTH_MODE', () => {
  it('defaults to development when NODE_ENV=development and AUTH_MODE is unset, with no COGNITO_* required', () => {
    const config = validateEnv({ NODE_ENV: 'development', DATABASE_URL: VALID_DATABASE_URL, APP_DATABASE_URL: VALID_APP_DATABASE_URL });
    expect(config.AUTH_MODE).toBe('development');
  });

  it('defaults to cognito when NODE_ENV=production and AUTH_MODE is unset', () => {
    const config = validateEnv({
      NODE_ENV: 'production',
      DATABASE_URL: VALID_DATABASE_URL,
      APP_DATABASE_URL: VALID_APP_DATABASE_URL,
      ...VALID_COGNITO_ENV,
    });
    expect(config.AUTH_MODE).toBe('cognito');
  });

  it('defaults to cognito when NODE_ENV=test and AUTH_MODE is unset', () => {
    const config = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: VALID_DATABASE_URL,
      APP_DATABASE_URL: VALID_APP_DATABASE_URL,
      ...VALID_COGNITO_ENV,
    });
    expect(config.AUTH_MODE).toBe('cognito');
  });

  it('honors an explicit AUTH_MODE=cognito even when NODE_ENV=development', () => {
    const config = validateEnv({ NODE_ENV: 'development', ...VALID_ENV });
    expect(config.AUTH_MODE).toBe('cognito');
  });

  it('honors an explicit AUTH_MODE=development when NODE_ENV=test', () => {
    const config = validateEnv({
      NODE_ENV: 'test',
      DATABASE_URL: VALID_DATABASE_URL,
      APP_DATABASE_URL: VALID_APP_DATABASE_URL,
      AUTH_MODE: 'development',
    });
    expect(config.AUTH_MODE).toBe('development');
  });

  it('does not require any COGNITO_* variable when AUTH_MODE=development', () => {
    const config = validateEnv({
      NODE_ENV: 'development',
      DATABASE_URL: VALID_DATABASE_URL,
      APP_DATABASE_URL: VALID_APP_DATABASE_URL,
      AUTH_MODE: 'development',
    });
    expect(config.COGNITO_USER_POOL_ID).toBeUndefined();
    expect(config.COGNITO_CLIENT_ID).toBeUndefined();
    expect(config.COGNITO_REGION).toBeUndefined();
  });

  it('refuses to boot when AUTH_MODE=development and NODE_ENV=production (impossible-to-activate-accidentally guarantee)', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        DATABASE_URL: VALID_DATABASE_URL,
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
        AUTH_MODE: 'development',
      }),
    ).toThrow(/AUTH_MODE=development is not allowed when NODE_ENV=production/);
  });

  it('rejects an unrecognised AUTH_MODE value', () => {
    expect(() =>
      validateEnv({
        DATABASE_URL: VALID_DATABASE_URL,
        APP_DATABASE_URL: VALID_APP_DATABASE_URL,
        AUTH_MODE: 'mock',
        ...VALID_COGNITO_ENV,
      }),
    ).toThrow(/AUTH_MODE/);
  });
});
