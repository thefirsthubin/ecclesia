import { AuthModule } from './auth.module';
import { CognitoVerifierService } from './cognito-verifier.service';
import { DevAuthController } from './controllers/dev-auth.controller';
import { DevAuthService } from './dev-auth.service';
import { TOKEN_VERIFIER } from './token-verifier.interface';

/**
 * Development Authentication sprint. `AuthModule.register()` computes its
 * `providers`/`controllers` arrays once, at call time, from
 * `process.env` (see that file's own comment on why this can't be a
 * `useFactory` provider instead) — these tests exercise that composition
 * directly, confirming the Production Acceptance Criteria's "the
 * development provider must disappear completely" and STEP 3's "never
 * expose differences to the remainder of the application" hold at the
 * module-wiring level, not just by reading the source.
 */
describe('AuthModule.register()', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('wires CognitoVerifierService as TOKEN_VERIFIER and omits DevAuthController when AUTH_MODE=cognito', () => {
    process.env.AUTH_MODE = 'cognito';
    process.env.NODE_ENV = 'test';

    const dynamicModule = AuthModule.register();

    expect(dynamicModule.providers).toContain(CognitoVerifierService);
    expect(dynamicModule.providers).toContainEqual({ provide: TOKEN_VERIFIER, useExisting: CognitoVerifierService });
    expect(dynamicModule.providers).not.toContain(DevAuthService);
    expect(dynamicModule.controllers).not.toContain(DevAuthController);
  });

  it('wires DevAuthService as TOKEN_VERIFIER and registers DevAuthController when AUTH_MODE=development', () => {
    process.env.AUTH_MODE = 'development';
    process.env.NODE_ENV = 'test';

    const dynamicModule = AuthModule.register();

    expect(dynamicModule.providers).toContain(DevAuthService);
    expect(dynamicModule.providers).toContainEqual({ provide: TOKEN_VERIFIER, useExisting: DevAuthService });
    expect(dynamicModule.providers).not.toContain(CognitoVerifierService);
    expect(dynamicModule.controllers).toContain(DevAuthController);
  });

  it('refuses to compose the module at all when AUTH_MODE=development and NODE_ENV=production', () => {
    process.env.AUTH_MODE = 'development';
    process.env.NODE_ENV = 'production';

    expect(() => AuthModule.register()).toThrow(/AUTH_MODE=development is not allowed when NODE_ENV=production/);
  });

  it('defaults to cognito wiring when AUTH_MODE is unset and NODE_ENV=production', () => {
    delete process.env.AUTH_MODE;
    process.env.NODE_ENV = 'production';

    const dynamicModule = AuthModule.register();

    expect(dynamicModule.providers).toContain(CognitoVerifierService);
    expect(dynamicModule.controllers).not.toContain(DevAuthController);
  });
});
