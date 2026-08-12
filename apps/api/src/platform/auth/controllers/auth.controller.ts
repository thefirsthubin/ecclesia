import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ActorContext } from '@ecclesia/rbac';
import type { ActorContextResponseDto } from '@ecclesia/contracts';

import type { EnvConfig } from '../../config/env.schema';
import { PrismaService } from '../../database/prisma.service';
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
 *
 * `[Release 1 blocker fix]` Now also resolves `branchName` from the
 * actor's own `branchId` (already resolved by `AuthGuard` — no new
 * branch-resolution mechanism, just one small read using the id already
 * in hand) — the dashboard header's only real source for the church's
 * actual name, replacing the previous `DEMO_CHURCH_NAME` placeholder
 * (`dashboardDemoData.ts`'s own doc comment anticipated exactly this: "a
 * one-line change here" once a real field exists). A direct
 * `PrismaService` read here, not a repository — matching this module's
 * own existing precedent (`ActorContextResolverService` reads Prisma
 * directly too); `platform/auth` has no repository layer at all, unlike
 * `modules/*`'s domain controllers. By the time this handler runs,
 * `BranchScopeInterceptor` has already set this request's branch scope
 * (`AuthGuard` runs first), so the ordinary RLS-scoped `PrismaService` is
 * safe to use here, unlike `ActorContextResolverService` itself (which
 * must use `PrismaRootService` instead — see that class's own doc
 * comment for why).
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  @Get('me')
  async getCurrentActor(@CurrentActor() actor: ActorContext): Promise<ActorContextResponseDto> {
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: actor.branchId },
      select: { name: true },
    });
    return { ...actor, branchName: branch.name };
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
