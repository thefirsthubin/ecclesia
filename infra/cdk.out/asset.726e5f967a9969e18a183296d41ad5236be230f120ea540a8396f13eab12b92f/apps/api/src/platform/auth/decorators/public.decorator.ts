// SetMetadata calls Reflect.defineMetadata at decoration time - this
// import must land before that runs, matching libs/rbac's own precedent
// (require-permission.decorator.ts) for any module that might be loaded
// standalone (e.g. under Jest) rather than via apps/api/src/main.ts, which
// only imports the polyfill for the running application.
import 'reflect-metadata';

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic' as const;

/**
 * Opt-out of `AuthGuard` for a specific route or controller (Sprint 1.4).
 * Deliberately opt-out, not opt-in - `AuthGuard` is applied globally
 * (`APP_GUARD`, see `auth.module.ts`) because Blueprint §8.1 frames every
 * endpoint as requiring a verified identity by default. The only route
 * that legitimately needs this today is `GET /health`: ECS/ALB health
 * checks (Blueprint §11.1/§11.3) cannot present a Cognito access token,
 * and gating infrastructure health monitoring behind application auth
 * would make the health check useless for its actual purpose. Any other
 * use of this decorator should be treated as suspicious by default, not
 * routine - a growing list of `@Public()` routes is a sign the auth model
 * needs revisiting, not a normal pattern to reach for.
 */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);
