import { Body, Controller, Get, Post } from '@nestjs/common';
import { z } from 'zod';

import { ZodValidationPipe } from '../../pipes/zod-validation.pipe';
import { Public } from '../decorators/public.decorator';
import { DevAuthService } from '../dev-auth.service';

const devLoginSchema = z.object({ devUserId: z.string().min(1) });
type DevLoginInput = z.infer<typeof devLoginSchema>;

/**
 * Development Authentication sprint - STEP 6's login experience,
 * server side. `auth.module.ts` only registers this controller at all
 * when `AUTH_MODE=development` (see that file's own comment) - when
 * `AUTH_MODE=cognito`, these routes do not exist in the Nest router at
 * all (a request to them 404s), satisfying the brief's "Production
 * Acceptance Criteria: the development provider must disappear
 * completely" literally, not just "return an error."
 *
 * Both routes are `@Public()` - the same structural reason `GET /auth/me`
 * cannot be (it needs an identity to read back) is exactly why *these*
 * must be: a route whose entire purpose is producing the very token
 * `AuthGuard` would otherwise require cannot itself require one, the same
 * chicken-and-egg reasoning that makes a real Cognito `InitiateAuth` call
 * unauthenticated too (`cognito-client.ts`'s `initiateAuth` presents no
 * bearer token either). `decorators/public.decorator.ts`'s own comment
 * warns that a growing list of `@Public()` routes should be treated as
 * suspicious, not routine - these two are the login boundary itself, the
 * one place that warning doesn't apply, and they only exist at all in a
 * mode this whole sprint exists to keep out of production.
 */
@Controller('auth/dev')
export class DevAuthController {
  constructor(private readonly devAuthService: DevAuthService) {}

  /** Powers the login screen's role picker (STEP 6). */
  @Get('users')
  @Public()
  async listUsers() {
    const users = await this.devAuthService.listAvailableUsers();
    // `[Multi-Tenant Foundation, Phase 2]` `context` passed through
    // verbatim (undefined stays undefined, matching `devUserSchema`'s own
    // `.optional()`) - see that schema's doc comment.
    return users.map((user) => ({ id: user.id, label: user.label, role: user.role, context: user.context }));
  }

  /** No password, no MFA (STEP 6: "No passwords required in development
   * mode"). Issues a development access token for the chosen seeded
   * persona - see `DevAuthService.issueTokenFor`'s own doc comment for
   * why this is safe to leave unauthenticated. */
  @Post('login')
  @Public()
  async login(@Body(new ZodValidationPipe(devLoginSchema)) body: DevLoginInput) {
    return this.devAuthService.issueTokenFor(body.devUserId);
  }
}
