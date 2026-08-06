// NestJS decorators call Reflect.defineMetadata at decoration time (not
// just at DI-resolution time), so the reflect-metadata polyfill must be
// loaded before this module's decorators run. apps/api's main.ts already
// imports it first for the running application; this import makes the
// same true when this file is loaded standalone (e.g. under Jest).
import 'reflect-metadata';

import { SetMetadata } from '@nestjs/common';

import type { Action } from '../actions';

/** Metadata key `RbacGuard` reads via `Reflector` (Blueprint §9.4). */
export const REQUIRE_PERMISSION_KEY = 'ecclesia:requirePermission' as const;

/**
 * Declares which `Action` (from PRD §17.3's matrix) a controller method
 * requires. Usage matches Blueprint §9.4 exactly:
 *
 * ```ts
 * @RequirePermission('stewardship.transaction.verify')
 * @UseGuards(RbacGuard, RecordLevelPolicyGuard)
 * async verifyTransaction(...) { ... }
 * ```
 */
export const RequirePermission = (action: Action) => SetMetadata(REQUIRE_PERMISSION_KEY, action);
