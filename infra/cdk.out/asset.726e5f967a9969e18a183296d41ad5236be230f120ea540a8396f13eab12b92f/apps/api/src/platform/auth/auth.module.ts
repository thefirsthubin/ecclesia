import type { DynamicModule } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AuditModule } from '../audit/audit.module';
import { DatabaseModule } from '../database/database.module';
import { ActorContextResolverService } from './actor-context-resolver.service';
import { assertAuthModeIsSafe } from './auth-mode';
import { AuthGuard } from './auth.guard';
import { CognitoVerifierService } from './cognito-verifier.service';
import { AuthController } from './controllers/auth.controller';
import { DevAuthController } from './controllers/dev-auth.controller';
import { DevAuthService } from './dev-auth.service';
import { TOKEN_VERIFIER } from './token-verifier.interface';

/**
 * Wires JWT verification + `ActorContext` resolution (Sprint 1.4, extended
 * by the Development Authentication sprint) as a global guard, so every
 * route requires a verified identity by default (opt out via `@Public()`)
 * rather than requiring each future domain controller to remember
 * `@UseGuards(AuthGuard)` individually - the same "secure by default, not
 * by convention" reasoning already applied to `AllExceptionsFilter`'s
 * `APP_FILTER` registration.
 *
 * `[Design Decision, Development Authentication sprint]` Which
 * `TokenVerifierService` implementation `AuthGuard` gets (bound to the
 * `TOKEN_VERIFIER` DI token) - and whether `DevAuthController`'s routes
 * exist in the router at all - is decided **once, at module-definition
 * time**, by calling `assertAuthModeIsSafe(process.env)` directly here
 * rather than reading `ConfigService` inside a factory provider. Two
 * reasons this shape was chosen over the more usual
 * `{ provide: TOKEN_VERIFIER, useFactory: (config) => ... }`:
 *
 * 1. STEP 3/Production Acceptance Criteria demand the *wrong* mode's
 *    machinery not just fail closed but not exist - "the development
 *    provider must disappear completely" and `CognitoVerifierService`
 *    must never be constructed at all in development (it would throw at
 *    construction time without real `COGNITO_*` values, since those are
 *    optional in the schema now - see that service's own defensive
 *    guard). A `useFactory` still *registers* both classes as providers
 *    and instantiates only the chosen one lazily; the module-level
 *    `providers`/`controllers` arrays computed here mean the unchosen
 *    implementation's class is never even added to Nest's DI container,
 *    and `DevAuthController`'s routes are never added to the HTTP router -
 *    a request to `/auth/dev/login` in `AUTH_MODE=cognito` 404s the same
 *    way a route that was never written would, not a 403/500 from a guard
 *    rejecting it at runtime.
 * 2. `assertAuthModeIsSafe` is the same throwing safety check
 *    `env.schema.ts`'s `.superRefine` already surfaces as a normal Zod
 *    validation issue (see that file's comment for why the check exists
 *    in both places) - calling it again here, independently of whether
 *    `ConfigModule` has finished validating yet, means this module can
 *    never boot with the unsafe `AUTH_MODE=development` + `NODE_ENV=production`
 *    combination even if something upstream of it changes. Defense in
 *    depth on the one rule the whole sprint brief is most explicit about
 *    ("impossible to activate accidentally in production").
 *
 * Reading `process.env` directly (rather than an injected `ConfigService`)
 * is unusual elsewhere in this codebase, but is the only option this early
 * in the module graph - module `providers`/`controllers` arrays are static,
 * evaluated before any Nest DI container exists to inject anything into.
 * `main.ts`'s `validateEnv` call already ran by the time this module is
 * instantiated in the real bootstrap path (see `main.ts`), so `process.env`
 * and the validated config agree by construction in every real run; the
 * only place they could theoretically disagree is a test harness that
 * imports `AuthModule` without first calling `validateEnv` - exactly why
 * `assertAuthModeIsSafe` is re-run here rather than trusted from outside.
 */
function buildAuthModule(): DynamicModule {
  const mode = assertAuthModeIsSafe(process.env);

  const modeSpecificProviders =
    mode === 'cognito'
      ? [CognitoVerifierService, { provide: TOKEN_VERIFIER, useExisting: CognitoVerifierService }]
      : [DevAuthService, { provide: TOKEN_VERIFIER, useExisting: DevAuthService }];

  const modeSpecificControllers = mode === 'cognito' ? [] : [DevAuthController];

  return {
    module: AuthModule,
    imports: [DatabaseModule, AuditModule],
    controllers: [AuthController, ...modeSpecificControllers],
    providers: [
      ...modeSpecificProviders,
      ActorContextResolverService,
      {
        provide: APP_GUARD,
        useClass: AuthGuard,
      },
    ],
    exports: [ActorContextResolverService, TOKEN_VERIFIER],
  };
}

@Module({})
export class AuthModule {
  static register(): DynamicModule {
    return buildAuthModule();
  }
}
