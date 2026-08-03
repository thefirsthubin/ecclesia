import { assertAuthModeIsSafe, computeAuthMode } from './auth-mode';

describe('computeAuthMode', () => {
  it('honors an explicit AUTH_MODE=cognito regardless of NODE_ENV', () => {
    expect(computeAuthMode({ AUTH_MODE: 'cognito', NODE_ENV: 'development' })).toBe('cognito');
    expect(computeAuthMode({ AUTH_MODE: 'cognito', NODE_ENV: 'production' })).toBe('cognito');
  });

  it('honors an explicit AUTH_MODE=development regardless of NODE_ENV', () => {
    expect(computeAuthMode({ AUTH_MODE: 'development', NODE_ENV: 'test' })).toBe('development');
    expect(computeAuthMode({ AUTH_MODE: 'development', NODE_ENV: 'production' })).toBe('development');
  });

  it('ignores an unrecognized AUTH_MODE value and falls back to NODE_ENV inference', () => {
    expect(computeAuthMode({ AUTH_MODE: 'mock', NODE_ENV: 'development' })).toBe('development');
  });

  it('defaults to development when NODE_ENV=development and AUTH_MODE is unset', () => {
    expect(computeAuthMode({ NODE_ENV: 'development' })).toBe('development');
  });

  it('defaults to cognito when NODE_ENV is production, test, or unset', () => {
    expect(computeAuthMode({ NODE_ENV: 'production' })).toBe('cognito');
    expect(computeAuthMode({ NODE_ENV: 'test' })).toBe('cognito');
    expect(computeAuthMode({})).toBe('cognito');
  });
});

describe('assertAuthModeIsSafe', () => {
  it('returns the computed mode when the combination is safe', () => {
    expect(assertAuthModeIsSafe({ NODE_ENV: 'development' })).toBe('development');
    expect(assertAuthModeIsSafe({ NODE_ENV: 'production', AUTH_MODE: 'cognito' })).toBe('cognito');
  });

  it('throws when AUTH_MODE=development and NODE_ENV=production, even set explicitly', () => {
    expect(() => assertAuthModeIsSafe({ AUTH_MODE: 'development', NODE_ENV: 'production' })).toThrow(
      /AUTH_MODE=development is not allowed when NODE_ENV=production/,
    );
  });

  it('does not throw when AUTH_MODE=development and NODE_ENV is development or test', () => {
    expect(() => assertAuthModeIsSafe({ AUTH_MODE: 'development', NODE_ENV: 'development' })).not.toThrow();
    expect(() => assertAuthModeIsSafe({ AUTH_MODE: 'development', NODE_ENV: 'test' })).not.toThrow();
  });
});
