import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ActorContext } from '@ecclesia/rbac';

import type { EnvConfig } from '../../config/env.schema';
import { CurrentActor } from '../decorators/current-actor.decorator';
import { Public } from '../decorators/public.decorator';

/**
 * `GET /auth/me` — Application Shell sprint addition (STEP 6: "if
 * additional endpoints are required, document them before implementation").
 *
 * The gap this closes: `AuthGuard` already resolves a full `ActorContext`
 * (role + scope) for every authenticated request via
 * `ActorContextResolverService`, but that resolution happens entirely
 * server-side and no route ever returned it to the client — there is no
 * Cognito token claim carrying role (see `AUTH_DESIGN_NOTES.md` and
 * `apps/web-admin/.../APPLICATION_SHELL_DESIGN_NOTES.md` §3 for the full
 * trace of where this was discovered). A role-aware client (web-admin's
 * nav/dashboard/redirect logic) has no other way to learn its own actor's
 * role. This route adds no new business logic: it is a direct read of the
 * same `ActorContext` `@CurrentActor()` already exposes to every other
 * controller, and is protected by the existing global `AuthGuard` like
 * every other route (no `@Public()`).
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  @Get('me')
  getCurrentActor(@CurrentActor() actor: ActorContext): ActorContext {
    return actor;
  }

  /**
   * `GET /auth/mode` — Development Authentication sprint (STEP 6). Lets
   * `LoginPage` decide, before any identity exists, whether to render the
   * Cognito email/password/MFA form or the development role picker
   * (`DevAuthController`'s routes, which only exist at all when this
   * returns `'development'` — see `auth.module.ts`). `@Public()` for the
   * same reason `DevAuthController`'s routes are: nothing has authenticated
   * yet at the point this is called. Reads the same effective `AUTH_MODE`
   * `env.schema.ts` computes and validates at boot (`EnvConfig['AUTH_MODE']`
   * is always a concrete `'cognito' | 'development'`, never the raw,
   * possibly-unset environment variable) — one source of truth, not a
   * second inference of the same fact.
   */
  @Get('mode')
  @Public()
  getAuthMode(): { mode: EnvConfig['AUTH_MODE'] } {
    return { mode: this.configService.get('AUTH_MODE', { infer: true }) };
  }
}
